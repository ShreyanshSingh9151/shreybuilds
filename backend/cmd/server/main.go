package main

import (
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/mailpilot-ai/backend/internal/config"
	"github.com/mailpilot-ai/backend/internal/handlers"
	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/router"
	"github.com/mailpilot-ai/backend/internal/services"
	"github.com/mailpilot-ai/backend/internal/store"
)

func main() {
	// Load .env file (system env vars take precedence)
	config.LoadDotEnv(".env")

	// Load configuration
	cfg := config.Load()

	// Initialize stores
	actionStore := store.NewActionStore()
	memoryStore := store.NewMemoryStore()
	inboxStore := store.NewInboxStore()

	// Seed demo data
	seedInboxes(inboxStore)
	seedEmails(inboxStore)
	seedActions(actionStore)

	// Initialize services
	modelRouter := services.NewModelRouter(cfg)
	emailAISvc := services.NewEmailAIService(cfg, modelRouter, memoryStore, actionStore)
	memorySvc := services.NewMemoryService(memoryStore)
	analyticsSvc := services.NewAnalyticsService(actionStore, inboxStore)
	inboxSvc := services.NewInboxService(inboxStore)

	// Initialize handlers
	healthH := handlers.NewHealthHandler(cfg)
	emailAIH := handlers.NewEmailAIHandler(emailAISvc)
	memoryH := handlers.NewMemoryHandler(memorySvc)
	dashboardH := handlers.NewDashboardHandler(analyticsSvc)
	inboxH := handlers.NewInboxHandler(inboxSvc)

	// Build router
	r := router.New(cfg, healthH, emailAIH, memoryH, dashboardH, inboxH)

	// Start server
	addr := ":" + cfg.Port
	log.Printf("========================================")
	log.Printf("  MailPilot AI Backend")
	log.Printf("  Environment : %s", cfg.Environment)
	log.Printf("  Listening   : http://localhost%s", addr)
	log.Printf("  Health      : http://localhost%s/health", addr)
	log.Printf("  API Base    : http://localhost%s/api/v1", addr)
	log.Printf("  OpenRouter  : %s", maskKey(cfg.OpenRouterAPIKey))
	log.Printf("========================================")

	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

// maskKey shows first 8 and last 4 chars of a key for logging.
func maskKey(key string) string {
	if key == "" {
		return "(not set — using mock)"
	}
	if len(key) <= 12 {
		return "****"
	}
	return key[:8] + "..." + key[len(key)-4:]
}

// ---- Seed data functions ----

func seedInboxes(s *store.InboxStore) {
	s.SetInboxes([]models.Inbox{
		{
			ID:          "inbox_gmail_1",
			Provider:    "gmail",
			Email:       "demo.user@gmail.com",
			DisplayName: "Demo User (Gmail)",
			Connected:   true,
			UnreadCount: 12,
		},
		{
			ID:          "inbox_outlook_1",
			Provider:    "outlook",
			Email:       "demo.user@outlook.com",
			DisplayName: "Demo User (Outlook)",
			Connected:   true,
			UnreadCount: 5,
		},
	})
}

func seedEmails(s *store.InboxStore) {
	now := time.Now()
	s.SetEmails([]models.RecentEmail{
		{
			ID:          "email_1",
			Provider:    "gmail",
			ThreadID:    "thread_101",
			Subject:     "Q4 Budget Review — Action Required",
			Sender:      "finance@acmecorp.com",
			Preview:     "Hi team, please review the attached Q4 budget breakdown and confirm allocations by Friday.",
			ReceivedAt:  now.Add(-2 * time.Hour),
			IsRead:      false,
			Category:    "finance",
			Priority:    "high",
			AIProcessed: true,
		},
		{
			ID:          "email_2",
			Provider:    "gmail",
			ThreadID:    "thread_102",
			Subject:     "Client escalation on delivery delay",
			Sender:      "client@bigcorp.com",
			Preview:     "We are experiencing significant delays on the deliverables promised for last week. This needs immediate attention.",
			ReceivedAt:  now.Add(-4 * time.Hour),
			IsRead:      false,
			Category:    "escalation",
			Priority:    "critical",
			AIProcessed: true,
		},
		{
			ID:          "email_3",
			Provider:    "gmail",
			ThreadID:    "thread_103",
			Subject:     "Weekly standup notes — Sprint 14",
			Sender:      "pm@company.com",
			Preview:     "Here are the notes from today's standup. Key blockers: API integration pending, design review needed.",
			ReceivedAt:  now.Add(-6 * time.Hour),
			IsRead:      true,
			Category:    "status_update",
			Priority:    "low",
			AIProcessed: true,
		},
		{
			ID:          "email_4",
			Provider:    "outlook",
			ThreadID:    "thread_201",
			Subject:     "Partnership proposal — CloudSync Integration",
			Sender:      "partnerships@cloudsync.io",
			Preview:     "We'd love to explore a potential integration between our platforms. Attached is our preliminary proposal.",
			ReceivedAt:  now.Add(-8 * time.Hour),
			IsRead:      true,
			Category:    "business_development",
			Priority:    "medium",
			AIProcessed: false,
		},
		{
			ID:          "email_5",
			Provider:    "gmail",
			ThreadID:    "thread_104",
			Subject:     "Invoice #INV-2024-0892 — Payment Due",
			Sender:      "billing@vendorx.com",
			Preview:     "Please find attached invoice #INV-2024-0892 for services rendered. Payment is due within 30 days.",
			ReceivedAt:  now.Add(-12 * time.Hour),
			IsRead:      false,
			Category:    "finance",
			Priority:    "medium",
			AIProcessed: true,
		},
		{
			ID:          "email_6",
			Provider:    "gmail",
			ThreadID:    "thread_105",
			Subject:     "Design review feedback — Dashboard v2",
			Sender:      "designer@company.com",
			Preview:     "I've reviewed the latest mockups and have some feedback on the navigation flow and color scheme.",
			ReceivedAt:  now.Add(-18 * time.Hour),
			IsRead:      true,
			Category:    "review_request",
			Priority:    "medium",
			AIProcessed: true,
		},
		{
			ID:          "email_7",
			Provider:    "outlook",
			ThreadID:    "thread_202",
			Subject:     "Meeting rescheduled: Product sync",
			Sender:      "calendar@company.com",
			Preview:     "The product sync meeting has been moved to Thursday 3pm. Updated invite attached.",
			ReceivedAt:  now.Add(-24 * time.Hour),
			IsRead:      true,
			Category:    "scheduling",
			Priority:    "low",
			AIProcessed: false,
		},
		{
			ID:          "email_8",
			Provider:    "gmail",
			ThreadID:    "thread_106",
			Subject:     "Urgent: Production incident P1",
			Sender:      "ops@company.com",
			Preview:     "We have a P1 incident on the payment processing service. Response times are degraded. All hands needed.",
			ReceivedAt:  now.Add(-1 * time.Hour),
			IsRead:      false,
			Category:    "escalation",
			Priority:    "critical",
			AIProcessed: true,
		},
	})
}

func seedActions(s *store.ActionStore) {
	now := time.Now()
	seed := []models.ActionRecord{
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_101",
			Subject: "Q4 Budget Review — Action Required", Sender: "finance@acmecorp.com",
			ActionType: "summarize", SelectedModel: "auto", RoutedModel: "claude",
			ActualModel: "openrouter/claude-profile", RouteReason: "auto routed summarize to claude-like profile for long-context comprehension",
			ActionItemsCount: 3, TokensEst: 420, CostEst: 0.0105, BaselineCostUSD: 0.0126, CostSavingsUSD: 0.0021, LatencyMs: 380,
			Timestamp: now.Add(-90 * time.Minute), ResultPreview: "This thread discusses the Q4 budget review...",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_102",
			Subject: "Client escalation on delivery delay", Sender: "client@bigcorp.com",
			ActionType: "classify", Category: "escalation", SelectedModel: "auto", RoutedModel: "gemini",
			ActualModel: "openrouter/gemini-profile", RouteReason: "auto routed classify-style task to gemini-like profile for fast low-cost structure extraction",
			PriorityReason: "Client escalation and urgency markers indicate elevated priority.", Confidence: 0.95, ActionItemsCount: 2,
			TokensEst: 280, CostEst: 0.00028, BaselineCostUSD: 0.0084, CostSavingsUSD: 0.00812, LatencyMs: 290,
			Timestamp: now.Add(-80 * time.Minute), ResultPreview: "Email classified as: escalation",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_102",
			Subject: "Client escalation on delivery delay", Sender: "client@bigcorp.com",
			ActionType: "reply", SelectedModel: "gpt", RoutedModel: "gpt",
			ActualModel: "openrouter/gpt-profile", RouteReason: "user-selected profile",
			ActionItemsCount: 2, TokensEst: 650, CostEst: 0.0195, BaselineCostUSD: 0.0195, CostSavingsUSD: 0.0, LatencyMs: 520,
			Timestamp: now.Add(-75 * time.Minute), ResultPreview: "Hi Client, Thank you for reaching out...",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_103",
			Subject: "Weekly standup notes — Sprint 14", Sender: "pm@company.com",
			ActionType: "summarize", SelectedModel: "claude", RoutedModel: "claude",
			ActualModel: "openrouter/claude-profile", RouteReason: "user-selected profile",
			ActionItemsCount: 4, TokensEst: 380, CostEst: 0.0095, BaselineCostUSD: 0.0114, CostSavingsUSD: 0.0019, LatencyMs: 340,
			Timestamp: now.Add(-60 * time.Minute), ResultPreview: "Here's my analysis of this email thread...",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_104",
			Subject: "Invoice #INV-2024-0892 — Payment Due", Sender: "billing@vendorx.com",
			ActionType: "classify", Category: "finance_operations", SelectedModel: "auto", RoutedModel: "gemini",
			ActualModel: "openrouter/gemini-profile", RouteReason: "auto routed classify-style task to gemini-like profile for fast low-cost structure extraction",
			PriorityReason: "Invoice due date signals medium urgency and finance workflow impact.", Confidence: 0.93, ActionItemsCount: 2,
			TokensEst: 210, CostEst: 0.00021, BaselineCostUSD: 0.0063, CostSavingsUSD: 0.00609, LatencyMs: 250,
			Timestamp: now.Add(-50 * time.Minute), ResultPreview: "Email classified as: finance_operations",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_105",
			Subject: "Design review feedback — Dashboard v2", Sender: "designer@company.com",
			ActionType: "rewrite", SelectedModel: "auto", RoutedModel: "gpt",
			ActualModel: "openrouter/gpt-profile", RouteReason: "auto routed reply/rewrite to gpt-like profile for drafting quality",
			ActionItemsCount: 3, TokensEst: 490, CostEst: 0.0147, BaselineCostUSD: 0.0147, CostSavingsUSD: 0.0, LatencyMs: 410,
			Timestamp: now.Add(-40 * time.Minute), ResultPreview: "Thank you for bringing this to our attention...",
		},
		{
			ID: uuid.New().String(), Provider: "outlook", ThreadID: "thread_201",
			Subject: "Partnership proposal — CloudSync Integration", Sender: "partnerships@cloudsync.io",
			ActionType: "summarize", SelectedModel: "auto", RoutedModel: "claude",
			ActualModel: "openrouter/claude-profile", RouteReason: "auto routed summarize to claude-like profile for long-context comprehension",
			ActionItemsCount: 4, TokensEst: 510, CostEst: 0.01275, BaselineCostUSD: 0.0153, CostSavingsUSD: 0.00255, LatencyMs: 460,
			Timestamp: now.Add(-30 * time.Minute), ResultPreview: "This thread discusses a potential integration...",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_106",
			Subject: "Urgent: Production incident P1", Sender: "ops@company.com",
			ActionType: "classify", Category: "critical_escalation", SelectedModel: "gemini", RoutedModel: "gemini",
			ActualModel: "openrouter/gemini-profile", RouteReason: "user-selected profile",
			PriorityReason: "P1 production incident is critical and requires immediate ownership.", Confidence: 0.96, ActionItemsCount: 3,
			TokensEst: 190, CostEst: 0.00019, BaselineCostUSD: 0.0057, CostSavingsUSD: 0.00551, LatencyMs: 220,
			Timestamp: now.Add(-20 * time.Minute), ResultPreview: "Email classified as: critical_escalation",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_106",
			Subject: "Urgent: Production incident P1", Sender: "ops@company.com",
			ActionType: "reply", SelectedModel: "auto", RoutedModel: "gpt",
			ActualModel: "openrouter/gpt-profile", RouteReason: "auto routed reply/rewrite to gpt-like profile for drafting quality",
			ActionItemsCount: 3, TokensEst: 580, CostEst: 0.0174, BaselineCostUSD: 0.0174, CostSavingsUSD: 0.0, LatencyMs: 490,
			Timestamp: now.Add(-15 * time.Minute), ResultPreview: "Hi Ops, Thank you for the alert. I'm reviewing...",
		},
		{
			ID: uuid.New().String(), Provider: "gmail", ThreadID: "thread_101",
			Subject: "Q4 Budget Review — Action Required", Sender: "finance@acmecorp.com",
			ActionType: "reply", SelectedModel: "auto", RoutedModel: "gpt",
			ActualModel: "openrouter/gpt-profile", RouteReason: "auto routed reply/rewrite to gpt-like profile for drafting quality",
			ActionItemsCount: 2, TokensEst: 540, CostEst: 0.0162, BaselineCostUSD: 0.0162, CostSavingsUSD: 0.0, LatencyMs: 430,
			Timestamp: now.Add(-10 * time.Minute), ResultPreview: "Hi Finance, Thank you for sharing the Q4...",
		},
	}

	for _, r := range seed {
		s.Append(r)
	}

	log.Printf("[seed] Loaded %d demo action records", len(seed))
}
