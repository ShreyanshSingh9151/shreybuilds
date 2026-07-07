package store

import (
	"sync"

	"github.com/mailpilot-ai/backend/internal/models"
)

// InboxStore provides thread-safe in-memory storage for connected inboxes and emails.
type InboxStore struct {
	mu      sync.RWMutex
	inboxes []models.Inbox
	emails  []models.RecentEmail
}

// NewInboxStore creates an InboxStore with default demo inboxes.
func NewInboxStore() *InboxStore {
	return &InboxStore{
		inboxes: make([]models.Inbox, 0, 4),
		emails:  make([]models.RecentEmail, 0, 64),
	}
}

// SetInboxes replaces the inbox list.
func (s *InboxStore) SetInboxes(inboxes []models.Inbox) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.inboxes = inboxes
}

// GetInboxes returns a copy of all inboxes.
func (s *InboxStore) GetInboxes() []models.Inbox {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Inbox, len(s.inboxes))
	copy(out, s.inboxes)
	return out
}

// SetEmails replaces the recent emails list.
func (s *InboxStore) SetEmails(emails []models.RecentEmail) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.emails = emails
}

// GetEmails returns a copy of recent emails.
func (s *InboxStore) GetEmails() []models.RecentEmail {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.RecentEmail, len(s.emails))
	copy(out, s.emails)
	return out
}

// ConnectedCount returns the number of connected inboxes.
func (s *InboxStore) ConnectedCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	count := 0
	for _, inbox := range s.inboxes {
		if inbox.Connected {
			count++
		}
	}
	return count
}

// TotalUnread returns the sum of unread counts across all inboxes.
func (s *InboxStore) TotalUnread() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	total := 0
	for _, inbox := range s.inboxes {
		total += inbox.UnreadCount
	}
	return total
}
