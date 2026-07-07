package services

import (
	"log"
	"strings"

	"github.com/mailpilot-ai/backend/internal/config"
	"github.com/mailpilot-ai/backend/internal/providers"
)

// ModelRouter resolves which LLM provider to use for a given action and user selection.
type ModelRouter struct {
	cfg       *config.Config
	providers map[string]providers.LLMProvider
	actual    map[string]string
}

// RouteDecision contains routing metadata for an AI action.
type RouteDecision struct {
	Provider      providers.LLMProvider
	SelectedModel string
	RoutedModel   string
	ActualModel   string
	RouteReason   string
}

// NewModelRouter creates a ModelRouter populated with mock providers.
// When real API keys are configured, real providers can be registered here.
func NewModelRouter(cfg *config.Config) *ModelRouter {
	mr := &ModelRouter{
		cfg:       cfg,
		providers: make(map[string]providers.LLMProvider),
		actual:    make(map[string]string),
	}

	if cfg.OpenRouterAPIKey != "" {
		log.Println("[model-router] OpenRouter key detected — using OpenRouter-backed logical profiles")
		mr.providers["gpt"] = providers.NewOpenAICompatibleProvider(cfg.OpenRouterAPIKey, cfg.OpenRouterBaseURL, cfg.OpenRouterModelGPT).WithLogicalName("gpt")
		mr.providers["claude"] = providers.NewOpenAICompatibleProvider(cfg.OpenRouterAPIKey, cfg.OpenRouterBaseURL, cfg.OpenRouterModelClaude).WithLogicalName("claude")
		mr.providers["gemini"] = providers.NewOpenAICompatibleProvider(cfg.OpenRouterAPIKey, cfg.OpenRouterBaseURL, cfg.OpenRouterModelGemini).WithLogicalName("gemini")

		mr.actual["gpt"] = cfg.OpenRouterModelGPT
		mr.actual["claude"] = cfg.OpenRouterModelClaude
		mr.actual["gemini"] = cfg.OpenRouterModelGemini
		return mr
	}

	if cfg.GeminiKey != "" {
		log.Println("[model-router] Gemini-only mode enabled — using real Gemini provider without mock fallback")
		mr.providers["gemini"] = providers.NewGeminiProvider(cfg.GeminiKey)
		mr.providers["gpt"] = mr.providers["gemini"]
		mr.providers["claude"] = mr.providers["gemini"]
		mr.actual["gpt"] = "google/gemini-direct"
		mr.actual["claude"] = "google/gemini-direct"
		mr.actual["gemini"] = "google/gemini-direct"
		return mr
	}

	// Default local/demo mode when no Gemini key is configured.
	mr.providers["gpt"] = &providers.MockGPT{}
	mr.providers["claude"] = &providers.MockClaude{}
	mr.providers["gemini"] = &providers.MockGemini{}
	mr.actual["gpt"] = "mock:gpt-profile"
	mr.actual["claude"] = "mock:claude-profile"
	mr.actual["gemini"] = "mock:gemini-profile"
	log.Println("[model-router] No OpenRouter key — using mock providers")

	return mr
}

// autoRouteRules maps action types to their default model in "auto" mode.
var autoRouteRules = map[string]string{
	"summarize": "claude",
	"reply":     "gpt",
	"classify":  "gemini",
	"rewrite":   "gpt",
	"priority":  "gemini",
	"actions":   "gemini",
}

// Resolve returns the appropriate LLM provider for the given action and user selection.
// It also returns metadata used by analytics and UI explanations.
func (mr *ModelRouter) Resolve(selectedModel, actionType string) RouteDecision {
	selected := strings.ToLower(strings.TrimSpace(selectedModel))
	if selected == "" {
		selected = "auto"
	}

	routed := selected
	reason := "user-selected profile"

	if selected == "auto" {
		if mapped, ok := autoRouteRules[actionType]; ok {
			routed = mapped
			reason = autoReasonForAction(actionType)
		} else {
			routed = "gpt"
			reason = "auto fallback to gpt-like profile for unknown action"
		}
	}

	provider, ok := mr.providers[routed]
	if !ok {
		fallback := mr.firstAvailable()
		routed = fallback
		provider = mr.providers[fallback]
		reason = reason + "; fallback due to unavailable routed profile"
	}

	if provider == nil {
		provider = &providers.MockGemini{}
		routed = "gemini"
		reason = reason + "; emergency mock fallback"
	}

	actual := mr.actual[routed]
	if actual == "" {
		actual = routed
	}

	log.Printf("[model-router] action=%s selected=%s routed=%s actual=%s reason=%s", actionType, selected, routed, actual, reason)

	return RouteDecision{
		Provider:      provider,
		SelectedModel: selected,
		RoutedModel:   routed,
		ActualModel:   actual,
		RouteReason:   reason,
	}
}

func autoReasonForAction(actionType string) string {
	switch actionType {
	case "summarize":
		return "auto routed summarize to claude-like profile for long-context comprehension"
	case "reply", "rewrite":
		return "auto routed reply/rewrite to gpt-like profile for drafting quality"
	case "classify", "priority", "actions":
		return "auto routed classify-style task to gemini-like profile for fast low-cost structure extraction"
	default:
		return "auto routing default applied"
	}
}

func (mr *ModelRouter) firstAvailable() string {
	for _, model := range []string{"gpt", "claude", "gemini"} {
		if _, ok := mr.providers[model]; ok {
			return model
		}
	}
	for model := range mr.providers {
		return model
	}
	return "gemini"
}

// AvailableModels returns the list of registered provider names.
func (mr *ModelRouter) AvailableModels() []string {
	names := make([]string, 0, len(mr.providers))
	for k := range mr.providers {
		names = append(names, k)
	}
	return names
}
