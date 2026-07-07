package services

import (
	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/store"
)

// MemoryService manages user preferences that influence AI outputs.
type MemoryService struct {
	store *store.MemoryStore
}

// NewMemoryService creates a MemoryService.
func NewMemoryService(store *store.MemoryStore) *MemoryService {
	return &MemoryService{store: store}
}

// GetPreferences returns the current user preferences.
func (s *MemoryService) GetPreferences() models.UserPreferences {
	return s.store.Get()
}

// UpdatePreferences merges updates into stored preferences.
func (s *MemoryService) UpdatePreferences(req models.MemoryPreferencesRequest) models.UserPreferences {
	return s.store.Update(req)
}
