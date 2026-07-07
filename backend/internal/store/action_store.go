package store

import (
	"sync"

	"github.com/mailpilot-ai/backend/internal/models"
)

// ActionStore provides thread-safe in-memory storage for AI action records.
type ActionStore struct {
	mu      sync.RWMutex
	records []models.ActionRecord
}

// NewActionStore creates an empty ActionStore.
func NewActionStore() *ActionStore {
	return &ActionStore{
		records: make([]models.ActionRecord, 0, 256),
	}
}

// Append adds a new action record.
func (s *ActionStore) Append(r models.ActionRecord) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.records = append(s.records, r)
}

// All returns a copy of all records (newest first).
func (s *ActionStore) All() []models.ActionRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.ActionRecord, len(s.records))
	for i, r := range s.records {
		out[len(s.records)-1-i] = r // reverse order
	}
	return out
}

// Count returns the total number of records.
func (s *ActionStore) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.records)
}

// Recent returns the last n records (newest first).
func (s *ActionStore) Recent(n int) []models.ActionRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	total := len(s.records)
	if n > total {
		n = total
	}
	out := make([]models.ActionRecord, n)
	for i := 0; i < n; i++ {
		out[i] = s.records[total-1-i]
	}
	return out
}
