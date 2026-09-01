package transfers

import "sync"

type HistoryStore interface {
	List() ([]Task, error)
	Save(task Task) error
	DeleteCompleted() error
	Close() error
}

type memoryHistoryStore struct {
	mu    sync.Mutex
	tasks map[string]Task
}

func newMemoryHistoryStore() *memoryHistoryStore {
	return &memoryHistoryStore{tasks: make(map[string]Task)}
}

func (s *memoryHistoryStore) List() ([]Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	result := make([]Task, 0, len(s.tasks))
	for _, task := range s.tasks {
		result = append(result, task)
	}
	return result, nil
}

func (s *memoryHistoryStore) Save(task Task) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tasks[task.ID] = task
	return nil
}

func (s *memoryHistoryStore) DeleteCompleted() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for id, task := range s.tasks {
		if isTerminal(task.Status) {
			delete(s.tasks, id)
		}
	}
	return nil
}

func (s *memoryHistoryStore) Close() error { return nil }
