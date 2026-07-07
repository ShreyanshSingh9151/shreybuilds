import { mockActions, mockEmails, mockInboxes, mockMemory, mockSummary } from "@/lib/mock-data";
import { mockEvaluationScenarios, mockEvaluationSummary } from "@/lib/mock-evaluation";
import type {
  ActionRecord,
  ApiEnvelope,
  CostBreakdown,
  DashboardSummary,
  EvaluationSummary,
  Inbox,
  MemoryPayload,
  MemoryPreferences,
  BenchmarkScenario,
  ModelUsageSummary,
  RecentEmail
} from "@/lib/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.success) {
    throw new Error(payload.error || "API request failed");
  }

  return payload.data;
}

export const api = {
  baseUrl: API_BASE_URL,
  summary: () => request<DashboardSummary>("/api/v1/dashboard/summary"),
  actions: () => request<ActionRecord[]>("/api/v1/dashboard/actions?limit=20"),
  costs: () => request<CostBreakdown>("/api/v1/dashboard/costs"),
  models: () => request<ModelUsageSummary>("/api/v1/dashboard/models"),
  evaluationScenarios: () => request<BenchmarkScenario[]>("/api/v1/evaluation/scenarios"),
  evaluationSummary: () => request<EvaluationSummary>("/api/v1/evaluation/summary"),
  inboxes: () => request<Inbox[]>("/api/v1/inboxes"),
  recentEmails: () => request<RecentEmail[]>("/api/v1/emails/recent"),
  memory: () => request<MemoryPreferences>("/api/v1/memory"),
  updateMemory: (payload: MemoryPayload) =>
    request<MemoryPreferences>("/api/v1/memory/preferences", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export const mockApi = {
  summary: async () => mockSummary,
  actions: async () => mockActions,
  evaluationScenarios: async (): Promise<BenchmarkScenario[]> => mockEvaluationScenarios,
  evaluationSummary: async (): Promise<EvaluationSummary> => mockEvaluationSummary,
  costs: async () => ({
    total_cost_usd: mockSummary.total_cost_usd,
    total_tokens: mockSummary.total_tokens,
    per_model: {
      gpt: { model: "gpt", tokens: 12800, cost_usd: 0.178, invocations: 62 },
      claude: { model: "claude", tokens: 8400, cost_usd: 0.0913, invocations: 31 },
      gemini: { model: "gemini", tokens: 5640, cost_usd: 0.015, invocations: 31 }
    }
  }),
  models: async () => ({
    models: [
      { model: "gpt", invocations: 62, tokens: 12800, cost_usd: 0.178, percentage: 50 },
      { model: "claude", invocations: 31, tokens: 8400, cost_usd: 0.0913, percentage: 25 },
      { model: "gemini", invocations: 31, tokens: 5640, cost_usd: 0.015, percentage: 25 }
    ]
  }),
  inboxes: async () => mockInboxes,
  recentEmails: async () => mockEmails,
  memory: async () => mockMemory,
  updateMemory: async (payload: MemoryPayload) => ({
    ...mockMemory,
    ...payload,
    updated_at: new Date().toISOString()
  })
};
