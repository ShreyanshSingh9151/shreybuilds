package store

import (
	"sync"
	"time"

	"github.com/mailpilot-ai/backend/internal/models"
)

// MemoryStore provides thread-safe in-memory storage for user preferences.
type MemoryStore struct {
	mu    sync.RWMutex
	prefs models.UserPreferences
}

// NewMemoryStore creates a MemoryStore with default preferences.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		prefs: models.UserPreferences{
			Name:               "Vatsal Chaudhary",
			Signature:          "Best regards,\nVatsal Chaudhary",
			PreferredTone:      "professional",
			DefaultModel:       "auto",
			ToneForClients:     "professional",
			ToneForInternal:    "friendly",
			CommonInstructions: "Keep replies concise, clear, and actionable.",
			UpdatedAt:          time.Now(),
		},
	}
}

// Get returns a copy of the current preferences.
func (s *MemoryStore) Get() models.UserPreferences {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.prefs
}

// Update merges non-empty fields from the request into stored preferences.
func (s *MemoryStore) Update(req models.MemoryPreferencesRequest) models.UserPreferences {
	s.mu.Lock()
	defer s.mu.Unlock()

	if req.Name != "" {
		s.prefs.Name = req.Name
	}
	if req.Signature != "" {
		s.prefs.Signature = req.Signature
	}
	if req.PreferredTone != "" {
		s.prefs.PreferredTone = req.PreferredTone
	}
	if req.DefaultModel != "" {
		s.prefs.DefaultModel = req.DefaultModel
	}
	if req.ToneForClients != "" {
		s.prefs.ToneForClients = req.ToneForClients
	}
	if req.ToneForInternal != "" {
		s.prefs.ToneForInternal = req.ToneForInternal
	}
	if req.CommonInstructions != "" {
		s.prefs.CommonInstructions = req.CommonInstructions
	}
	s.prefs.UpdatedAt = time.Now()

	return s.prefs
}
