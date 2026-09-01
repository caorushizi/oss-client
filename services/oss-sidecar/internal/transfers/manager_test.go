package transfers

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/profiles"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
)

type fakeProvider struct {
	upload   func(context.Context, storage.FileTransferInput) error
	download func(context.Context, storage.FileTransferInput) error
	list     func(storage.ListObjectsInput) (storage.ObjectPage, error)
}

func (fakeProvider) ListBuckets(context.Context, storage.Credentials) ([]storage.Bucket, error) {
	return nil, nil
}

func (fakeProvider) ListDomains(context.Context, storage.Credentials, string) ([]string, error) {
	return nil, nil
}

func (provider fakeProvider) ListObjects(
	_ context.Context,
	_ storage.Credentials,
	input storage.ListObjectsInput,
) (storage.ObjectPage, error) {
	if provider.list != nil {
		return provider.list(input)
	}
	return storage.ObjectPage{}, nil
}

func (provider fakeProvider) UploadFile(
	ctx context.Context,
	_ storage.Credentials,
	input storage.FileTransferInput,
) error {
	return provider.upload(ctx, input)
}

func (provider fakeProvider) DownloadFile(
	ctx context.Context,
	_ storage.Credentials,
	input storage.FileTransferInput,
) error {
	return provider.download(ctx, input)
}

func TestManagerTracksUploadProgress(t *testing.T) {
	localPath := filepath.Join(t.TempDir(), "upload.bin")
	content := make([]byte, 2048)
	if err := os.WriteFile(localPath, content, 0o600); err != nil {
		t.Fatal(err)
	}

	manager := testManager(t, fakeProvider{
		upload: func(_ context.Context, input storage.FileTransferInput) error {
			input.Progress(1024, 2048)
			input.Progress(2048, 2048)
			return nil
		},
		download: func(context.Context, storage.FileTransferInput) error { return nil },
	})
	defer manager.Close()

	task, err := manager.Start(StartInput{
		Direction: DirectionUpload,
		ProfileID: "profile-1",
		Bucket:    "bucket",
		ObjectKey: "upload.bin",
		LocalPath: localPath,
	})
	if err != nil {
		t.Fatal(err)
	}
	completed := waitForStatus(t, manager, task.ID, StatusCompleted)
	if completed.Transferred != 2048 || completed.Total != 2048 {
		t.Fatalf("unexpected progress: %#v", completed)
	}
}

func TestManagerRejectsExistingUploadUnlessOverwriteEnabled(t *testing.T) {
	localPath := filepath.Join(t.TempDir(), "upload.bin")
	if err := os.WriteFile(localPath, []byte("data"), 0o600); err != nil {
		t.Fatal(err)
	}
	uploaded := false
	manager := testManager(t, fakeProvider{
		list: func(input storage.ListObjectsInput) (storage.ObjectPage, error) {
			return storage.ObjectPage{Items: []storage.Object{{Key: input.Prefix}}}, nil
		},
		upload: func(context.Context, storage.FileTransferInput) error {
			uploaded = true
			return nil
		},
		download: func(context.Context, storage.FileTransferInput) error { return nil },
	})
	defer manager.Close()

	input := StartInput{
		Direction: DirectionUpload, ProfileID: "profile-1", Bucket: "bucket",
		ObjectKey: "upload.bin", LocalPath: localPath,
	}
	if _, err := manager.Start(input); !errors.Is(err, ErrObjectExists) {
		t.Fatalf("expected ErrObjectExists, got %v", err)
	}
	input.Overwrite = true
	task, err := manager.Start(input)
	if err != nil {
		t.Fatal(err)
	}
	waitForStatus(t, manager, task.ID, StatusCompleted)
	if !uploaded {
		t.Fatal("expected overwrite upload to run")
	}
}

func TestManagerReplacesDownloadAfterSuccess(t *testing.T) {
	destination := filepath.Join(t.TempDir(), "download.txt")
	if err := os.WriteFile(destination, []byte("old"), 0o600); err != nil {
		t.Fatal(err)
	}

	manager := testManager(t, fakeProvider{
		upload: func(context.Context, storage.FileTransferInput) error { return nil },
		download: func(_ context.Context, input storage.FileTransferInput) error {
			if err := os.WriteFile(input.LocalPath, []byte("new"), 0o600); err != nil {
				return err
			}
			input.Progress(3, 3)
			return nil
		},
	})
	defer manager.Close()

	task, err := manager.Start(StartInput{
		Direction: DirectionDownload,
		ProfileID: "profile-1",
		Bucket:    "bucket",
		ObjectKey: "download.txt",
		LocalPath: destination,
	})
	if err != nil {
		t.Fatal(err)
	}
	waitForStatus(t, manager, task.ID, StatusCompleted)

	content, err := os.ReadFile(destination)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != "new" {
		t.Fatalf("expected new download, got %q", content)
	}
	backups, err := filepath.Glob(destination + ".oss-client-backup-*")
	if err != nil {
		t.Fatal(err)
	}
	if len(backups) != 0 {
		t.Fatalf("unexpected backup files: %v", backups)
	}
}

func TestManagerCancelsRunningTransfer(t *testing.T) {
	localPath := filepath.Join(t.TempDir(), "upload.bin")
	if err := os.WriteFile(localPath, []byte("data"), 0o600); err != nil {
		t.Fatal(err)
	}

	manager := testManager(t, fakeProvider{
		upload: func(ctx context.Context, _ storage.FileTransferInput) error {
			<-ctx.Done()
			return ctx.Err()
		},
		download: func(context.Context, storage.FileTransferInput) error { return nil },
	})
	defer manager.Close()

	task, err := manager.Start(StartInput{
		Direction: DirectionUpload,
		ProfileID: "profile-1",
		Bucket:    "bucket",
		ObjectKey: "upload.bin",
		LocalPath: localPath,
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := manager.Cancel(task.ID); err != nil {
		t.Fatal(err)
	}
	waitForStatus(t, manager, task.ID, StatusCanceled)
}

func testManager(t *testing.T, provider storage.Provider) *Manager {
	t.Helper()
	store := profiles.NewMemoryStore()
	_, err := store.Create(profiles.Profile{
		ID:       "profile-1",
		Name:     "test",
		Provider: "fake",
		Credentials: profiles.Credentials{
			AccessKeyID:     "key",
			AccessKeySecret: "secret",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	return NewManager(
		store,
		storage.NewRegistry(map[string]storage.Provider{"fake": provider}),
	)
}

func waitForStatus(t *testing.T, manager *Manager, id string, status string) Task {
	t.Helper()
	deadline := time.NewTimer(2 * time.Second)
	defer deadline.Stop()
	ticker := time.NewTicker(5 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-deadline.C:
			t.Fatalf("timed out waiting for transfer %s", status)
		case <-ticker.C:
			for _, task := range manager.List() {
				if task.ID == id && task.Status == status {
					return task
				}
			}
		}
	}
}
