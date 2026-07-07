package services

import (
	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/store"
)

// InboxService manages connected inboxes and recent email data.
type InboxService struct {
	store *store.InboxStore
}

// NewInboxService creates an InboxService.
func NewInboxService(store *store.InboxStore) *InboxService {
	return &InboxService{store: store}
}

// GetInboxes returns all connected inboxes.
func (s *InboxService) GetInboxes() []models.Inbox {
	return s.store.GetInboxes()
}

// GetRecentEmails returns recently processed emails.
func (s *InboxService) GetRecentEmails() []models.RecentEmail {
	return s.store.GetEmails()
}

// InboxSummary returns a quick summary for the inbox overview.
type InboxSummaryResponse struct {
	TotalInboxes     int `json:"total_inboxes"`
	ConnectedCount   int `json:"connected_count"`
	TotalUnread      int `json:"total_unread"`
	TotalEmails      int `json:"total_emails"`
	AIProcessedCount int `json:"ai_processed_count"`
}

// GetSummary returns inbox summary counts.
func (s *InboxService) GetSummary() InboxSummaryResponse {
	inboxes := s.store.GetInboxes()
	emails := s.store.GetEmails()

	connected := 0
	totalUnread := 0
	for _, inbox := range inboxes {
		if inbox.Connected {
			connected++
		}
		totalUnread += inbox.UnreadCount
	}

	aiProcessed := 0
	for _, email := range emails {
		if email.AIProcessed {
			aiProcessed++
		}
	}

	return InboxSummaryResponse{
		TotalInboxes:     len(inboxes),
		ConnectedCount:   connected,
		TotalUnread:      totalUnread,
		TotalEmails:      len(emails),
		AIProcessedCount: aiProcessed,
	}
}
