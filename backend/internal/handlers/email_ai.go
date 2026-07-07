package handlers

import (
	"net/http"

	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/services"
)

// EmailAIHandler handles all AI action endpoints.
type EmailAIHandler struct {
	emailAI *services.EmailAIService
}

// NewEmailAIHandler creates an EmailAIHandler.
func NewEmailAIHandler(emailAI *services.EmailAIService) *EmailAIHandler {
	return &EmailAIHandler{emailAI: emailAI}
}

// Summarize handles POST /api/v1/threads/summarize
func (h *EmailAIHandler) Summarize(w http.ResponseWriter, r *http.Request) {
	var req models.AIActionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateAIRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.emailAI.Summarize(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "summarization failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Reply handles POST /api/v1/threads/reply
func (h *EmailAIHandler) Reply(w http.ResponseWriter, r *http.Request) {
	var req models.AIActionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateAIRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.emailAI.Reply(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reply generation failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Rewrite handles POST /api/v1/threads/rewrite
func (h *EmailAIHandler) Rewrite(w http.ResponseWriter, r *http.Request) {
	var req models.AIActionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateAIRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.emailAI.Rewrite(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "rewrite failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Classify handles POST /api/v1/threads/classify
func (h *EmailAIHandler) Classify(w http.ResponseWriter, r *http.Request) {
	var req models.AIActionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateAIRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.emailAI.Classify(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "classification failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// validateAIRequest performs basic validation on the AI action request.
func validateAIRequest(req models.AIActionRequest) error {
	if req.Content == "" {
		return errMissing("content")
	}
	if req.Provider == "" {
		return errMissing("provider")
	}
	if req.Provider != "gmail" && req.Provider != "outlook" {
		return errInvalid("provider", "must be 'gmail' or 'outlook'")
	}
	return nil
}
