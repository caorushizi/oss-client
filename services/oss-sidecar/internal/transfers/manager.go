package transfers

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/profiles"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
)

var (
	ErrInvalidInput = errors.New("invalid transfer input")
	ErrNotFound     = errors.New("transfer not found")
	ErrClosed       = errors.New("transfer manager is closed")
	ErrObjectExists = errors.New("object already exists")
)

const (
	DirectionUpload   = "upload"
	DirectionDownload = "download"

	StatusQueued    = "queued"
	StatusRunning   = "running"
	StatusCompleted = "completed"
	StatusFailed    = "failed"
	StatusCanceled  = "canceled"
)

type Task struct {
	ID          string    `json:"id"`
	Direction   string    `json:"direction"`
	Status      string    `json:"status"`
	ProfileID   string    `json:"profileId"`
	Bucket      string    `json:"bucket"`
	Region      string    `json:"region,omitempty"`
	ObjectKey   string    `json:"objectKey"`
	FileName    string    `json:"fileName"`
	Transferred int64     `json:"transferred"`
	Total       int64     `json:"total"`
	Error       string    `json:"error,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type StartInput struct {
	Direction string
	ProfileID string
	Bucket    string
	Region    string
	ObjectKey string
	LocalPath string
	Overwrite bool
	UseHTTPS  bool
}

type runtimeTask struct {
	task        Task
	cancel      context.CancelFunc
	lastPersist time.Time
}

type Manager struct {
	mu        sync.RWMutex
	tasks     map[string]*runtimeTask
	profiles  profiles.Store
	providers *storage.Registry
	history   HistoryStore
	slots     chan struct{}
	wait      sync.WaitGroup
	closed    bool
}

func NewManager(profileStore profiles.Store, providers *storage.Registry) *Manager {
	manager, _ := newManager(profileStore, providers, newMemoryHistoryStore())
	return manager
}

func NewPersistentManager(
	profileStore profiles.Store,
	providers *storage.Registry,
	path string,
) (*Manager, error) {
	history, err := NewSQLiteHistoryStore(path)
	if err != nil {
		return nil, err
	}
	manager, err := newManager(profileStore, providers, history)
	if err != nil {
		_ = history.Close()
		return nil, err
	}
	return manager, nil
}

func newManager(
	profileStore profiles.Store,
	providers *storage.Registry,
	history HistoryStore,
) (*Manager, error) {
	manager := &Manager{
		tasks:     make(map[string]*runtimeTask),
		profiles:  profileStore,
		providers: providers,
		history:   history,
		slots:     make(chan struct{}, 3),
	}
	stored, err := history.List()
	if err != nil {
		return nil, err
	}
	for _, task := range stored {
		if !isTerminal(task.Status) {
			task.Status = StatusCanceled
			task.Error = ""
			task.UpdatedAt = time.Now().UTC()
			if err := history.Save(task); err != nil {
				return nil, err
			}
		}
		manager.tasks[task.ID] = &runtimeTask{task: task, cancel: func() {}, lastPersist: task.UpdatedAt}
	}
	return manager, nil
}

func (m *Manager) List() []Task {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]Task, 0, len(m.tasks))
	for _, task := range m.tasks {
		result = append(result, task.task)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})
	return result
}

func (m *Manager) Start(input StartInput) (Task, error) {
	input.Direction = strings.TrimSpace(strings.ToLower(input.Direction))
	input.ProfileID = strings.TrimSpace(input.ProfileID)
	input.Bucket = strings.TrimSpace(input.Bucket)
	input.Region = strings.TrimSpace(strings.ToLower(input.Region))
	input.ObjectKey = strings.TrimSpace(input.ObjectKey)
	input.LocalPath = filepath.Clean(strings.TrimSpace(input.LocalPath))

	if (input.Direction != DirectionUpload && input.Direction != DirectionDownload) ||
		input.ProfileID == "" || input.Bucket == "" || input.ObjectKey == "" ||
		input.LocalPath == "." || !filepath.IsAbs(input.LocalPath) {
		return Task{}, ErrInvalidInput
	}

	profile, err := m.profiles.Get(input.ProfileID)
	if err != nil {
		return Task{}, err
	}
	provider, err := m.providers.Get(profile.Provider)
	if err != nil {
		return Task{}, err
	}

	total := int64(0)
	if input.Direction == DirectionUpload {
		info, err := os.Stat(input.LocalPath)
		if err != nil || !info.Mode().IsRegular() {
			return Task{}, ErrInvalidInput
		}
		total = info.Size()
		if !input.Overwrite {
			lookupContext, cancelLookup := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancelLookup()
			page, err := provider.ListObjects(lookupContext, providerCredentials(profile), storage.ListObjectsInput{
				Bucket: input.Bucket,
				Region: input.Region,
				Prefix: input.ObjectKey,
				Limit:  1000,
			})
			if err != nil {
				return Task{}, err
			}
			for _, object := range page.Items {
				if !object.IsDirectory && object.Key == input.ObjectKey {
					return Task{}, ErrObjectExists
				}
			}
		}
	} else {
		parent, err := os.Stat(filepath.Dir(input.LocalPath))
		if err != nil || !parent.IsDir() {
			return Task{}, ErrInvalidInput
		}
	}

	id, err := profiles.NewID()
	if err != nil {
		return Task{}, err
	}
	ctx, cancel := context.WithCancel(context.Background())
	now := time.Now().UTC()
	task := Task{
		ID:        id,
		Direction: input.Direction,
		Status:    StatusQueued,
		ProfileID: input.ProfileID,
		Bucket:    input.Bucket,
		Region:    input.Region,
		ObjectKey: input.ObjectKey,
		FileName:  filepath.Base(input.LocalPath),
		Total:     total,
		CreatedAt: now,
		UpdatedAt: now,
	}

	m.mu.Lock()
	if m.closed {
		m.mu.Unlock()
		cancel()
		return Task{}, ErrClosed
	}
	if err := m.history.Save(task); err != nil {
		m.mu.Unlock()
		cancel()
		return Task{}, err
	}
	m.tasks[id] = &runtimeTask{task: task, cancel: cancel, lastPersist: now}
	m.wait.Add(1)
	m.mu.Unlock()

	go m.run(ctx, provider, profile, input, id)
	return task, nil
}

func (m *Manager) Cancel(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	task, ok := m.tasks[id]
	if !ok {
		return ErrNotFound
	}
	if isTerminal(task.task.Status) {
		return nil
	}
	task.task.Status = StatusCanceled
	task.task.UpdatedAt = time.Now().UTC()
	_ = m.history.Save(task.task)
	task.lastPersist = task.task.UpdatedAt
	task.cancel()
	return nil
}

func (m *Manager) ClearCompleted() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if err := m.history.DeleteCompleted(); err != nil {
		return err
	}
	for id, task := range m.tasks {
		if isTerminal(task.task.Status) {
			delete(m.tasks, id)
		}
	}
	return nil
}

func (m *Manager) Close() {
	m.mu.Lock()
	if m.closed {
		m.mu.Unlock()
		return
	}
	m.closed = true
	for _, task := range m.tasks {
		if !isTerminal(task.task.Status) {
			task.task.Status = StatusCanceled
			task.task.UpdatedAt = time.Now().UTC()
			task.cancel()
		}
	}
	m.mu.Unlock()
	m.wait.Wait()
	_ = m.history.Close()
}

func (m *Manager) run(
	ctx context.Context,
	provider storage.Provider,
	profile profiles.Profile,
	input StartInput,
	id string,
) {
	defer m.wait.Done()

	select {
	case m.slots <- struct{}{}:
		defer func() { <-m.slots }()
	case <-ctx.Done():
		m.finish(id, ctx.Err())
		return
	}
	m.setRunning(id)

	localPath := input.LocalPath
	var temporaryPath string
	if input.Direction == DirectionDownload {
		file, err := os.CreateTemp(filepath.Dir(input.LocalPath), ".oss-client-download-*")
		if err != nil {
			m.finish(id, err)
			return
		}
		temporaryPath = file.Name()
		if err := file.Close(); err != nil {
			_ = os.Remove(temporaryPath)
			m.finish(id, err)
			return
		}
		localPath = temporaryPath
		defer os.Remove(temporaryPath)
	}

	transfer := storage.FileTransferInput{
		Bucket:    input.Bucket,
		Region:    input.Region,
		Key:       input.ObjectKey,
		LocalPath: localPath,
		UseHTTPS:  input.UseHTTPS,
		Progress: func(transferred int64, total int64) {
			m.setProgress(id, transferred, total)
		},
	}
	credentials := storage.Credentials{
		AccessKeyID:     profile.Credentials.AccessKeyID,
		AccessKeySecret: profile.Credentials.AccessKeySecret,
		Region:          profile.Region,
		Endpoint:        profile.Endpoint,
	}

	var err error
	if input.Direction == DirectionUpload {
		err = provider.UploadFile(ctx, credentials, transfer)
	} else {
		err = provider.DownloadFile(ctx, credentials, transfer)
		if err == nil {
			err = commitDownload(temporaryPath, input.LocalPath, id)
		}
	}
	m.finish(id, err)
}

func providerCredentials(profile profiles.Profile) storage.Credentials {
	return storage.Credentials{
		AccessKeyID:     profile.Credentials.AccessKeyID,
		AccessKeySecret: profile.Credentials.AccessKeySecret,
		Region:          profile.Region,
		Endpoint:        profile.Endpoint,
	}
}

func (m *Manager) setRunning(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if task, ok := m.tasks[id]; ok && task.task.Status == StatusQueued {
		task.task.Status = StatusRunning
		task.task.UpdatedAt = time.Now().UTC()
		_ = m.history.Save(task.task)
		task.lastPersist = task.task.UpdatedAt
	}
}

func (m *Manager) setProgress(id string, transferred int64, total int64) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if task, ok := m.tasks[id]; ok && !isTerminal(task.task.Status) {
		if transferred >= task.task.Transferred {
			task.task.Transferred = transferred
		}
		if total > 0 {
			task.task.Total = total
		}
		task.task.UpdatedAt = time.Now().UTC()
		if task.task.UpdatedAt.Sub(task.lastPersist) >= 500*time.Millisecond {
			_ = m.history.Save(task.task)
			task.lastPersist = task.task.UpdatedAt
		}
	}
}

func (m *Manager) finish(id string, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	task, ok := m.tasks[id]
	if !ok {
		return
	}
	if errors.Is(err, context.Canceled) || task.task.Status == StatusCanceled {
		task.task.Status = StatusCanceled
		task.task.Error = ""
	} else if err != nil {
		task.task.Status = StatusFailed
		task.task.Error = err.Error()
	} else {
		task.task.Status = StatusCompleted
		if task.task.Total > 0 {
			task.task.Transferred = task.task.Total
		}
	}
	task.task.UpdatedAt = time.Now().UTC()
	_ = m.history.Save(task.task)
	task.lastPersist = task.task.UpdatedAt
}

func commitDownload(temporaryPath string, destination string, id string) error {
	if _, err := os.Stat(destination); errors.Is(err, os.ErrNotExist) {
		return os.Rename(temporaryPath, destination)
	} else if err != nil {
		return err
	}

	backup := destination + ".oss-client-backup-" + id
	if _, err := os.Stat(backup); err == nil {
		return fmt.Errorf("download backup already exists")
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	if err := os.Rename(destination, backup); err != nil {
		return err
	}
	if err := os.Rename(temporaryPath, destination); err != nil {
		_ = os.Rename(backup, destination)
		return err
	}
	if err := os.Remove(backup); err != nil {
		return fmt.Errorf("remove download backup: %w", err)
	}
	return nil
}

func isTerminal(status string) bool {
	return status == StatusCompleted || status == StatusFailed || status == StatusCanceled
}
