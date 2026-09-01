package profiles

import (
	"errors"
	"sort"
	"strings"
	"sync"
)

var (
	ErrNotFound      = errors.New("profile not found")
	ErrNameExists    = errors.New("profile name already exists")
	ErrAccessKeyUsed = errors.New("access key already exists")
)

type Credentials struct {
	AccessKeyID     string
	AccessKeySecret string
}

type Profile struct {
	ID            string
	Name          string
	Provider      string
	Region        string
	Endpoint      string
	UploadBucket  string
	UploadPrefix  string
	DefaultDomain string
	Credentials   Credentials
}

type Store interface {
	List() ([]Profile, error)
	Get(id string) (Profile, error)
	Create(profile Profile) (Profile, error)
	Update(profile Profile) (Profile, error)
	Delete(id string) error
}

type MemoryStore struct {
	mu       sync.RWMutex
	profiles map[string]Profile
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{profiles: make(map[string]Profile)}
}

func (s *MemoryStore) List() ([]Profile, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Profile, 0, len(s.profiles))
	for _, profile := range s.profiles {
		result = append(result, profile)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})
	return result, nil
}

func (s *MemoryStore) Get(id string) (Profile, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	profile, ok := s.profiles[id]
	if !ok {
		return Profile{}, ErrNotFound
	}
	return profile, nil
}

func (s *MemoryStore) Create(profile Profile) (Profile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, existing := range s.profiles {
		if strings.EqualFold(existing.Name, profile.Name) {
			return Profile{}, ErrNameExists
		}
		if existing.Provider == profile.Provider &&
			existing.Endpoint == profile.Endpoint &&
			existing.Credentials.AccessKeyID == profile.Credentials.AccessKeyID {
			return Profile{}, ErrAccessKeyUsed
		}
	}

	s.profiles[profile.ID] = profile
	return profile, nil
}

func (s *MemoryStore) Update(profile Profile) (Profile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.profiles[profile.ID]; !ok {
		return Profile{}, ErrNotFound
	}
	for id, existing := range s.profiles {
		if id == profile.ID {
			continue
		}
		if strings.EqualFold(existing.Name, profile.Name) {
			return Profile{}, ErrNameExists
		}
		if existing.Provider == profile.Provider &&
			existing.Endpoint == profile.Endpoint &&
			existing.Credentials.AccessKeyID == profile.Credentials.AccessKeyID {
			return Profile{}, ErrAccessKeyUsed
		}
	}
	s.profiles[profile.ID] = profile
	return profile, nil
}

func (s *MemoryStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.profiles[id]; !ok {
		return ErrNotFound
	}
	delete(s.profiles, id)
	return nil
}
