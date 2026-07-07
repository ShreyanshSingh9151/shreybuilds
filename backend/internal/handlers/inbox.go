package handlers

import (
	"net/http"

	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/services"
)

// InboxHandler handles inbox and recent email endpoints.
type InboxHandler struct {
	inbox *services.InboxService
}

// NewInboxHandler creates an InboxHandler.
func NewInboxHandler(inbox *services.InboxService) *InboxHandler {
	return &InboxHandler{inbox: inbox}
}

// GetInboxes handles GET /api/v1/inboxes
func (h *InboxHandler) GetInboxes(w http.ResponseWriter, r *http.Request) {
	inboxes := h.inbox.GetInboxes()
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    inboxes,
	})
}

// GetRecentEmails handles GET /api/v1/emails/recent
func (h *InboxHandler) GetRecentEmails(w http.ResponseWriter, r *http.Request) {
	emails := h.inbox.GetRecentEmails()
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    emails,
	})
}
