export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export type DashboardSummary = {
  connected_inboxes: number;
  unread_count: number;
  pending_replies: number;
  total_ai_actions: number;
  total_tokens: number;
  total_cost_usd: number;
  baseline_cost_usd: number;
  cost_savings_usd: number;
  avg_latency_ms: number;
  model_usage: Record<string, number>;
  action_usage: Record<string, number>;
  category_counts: Record<string, number>;
};

export type Inbox = {
  id: string;
  provider: string;
  email: string;
  display_name: string;
  connected: boolean;
  unread_count: number;
};

export type RecentEmail = {
  id: string;
  provider: string;
  thread_id: string;
  subject: string;
  sender: string;
  preview: string;
  received_at: string;
  is_read: boolean;
  category: string;
  priority: string;
  ai_processed: boolean;
};

export type ActionRecord = {
  id: string;
  provider: string;
  thread_id: string;
  subject: string;
  sender: string;
  action_type: string;
  category?: string;
  selected_model: string;
  routed_model: string;
  actual_model?: string;
  route_reason?: string;
  priority_reason?: string;
  confidence?: number;
  action_items_count?: number;
  tokens_estimate: number;
  cost_estimate: number;
  baseline_cost_usd?: number;
  cost_savings_usd?: number;
  latency_ms: number;
  timestamp: string;
  result_preview: string;
};

export type ModelCost = {
  model: string;
  tokens: number;
  cost_usd: number;
  invocations: number;
};

export type CostBreakdown = {
  total_cost_usd: number;
  total_tokens: number;
  per_model: Record<string, ModelCost>;
};

export type ModelUsageEntry = {
  model: string;
  invocations: number;
  tokens: number;
  cost_usd: number;
  percentage: number;
};

export type ModelUsageSummary = {
  models: ModelUsageEntry[];
};

export type BenchmarkScenario = {
  id: string;
  provider: "gmail" | "outlook";
  subject: string;
  sender: string;
  action_type: "summarize" | "reply" | "rewrite" | "classify";
  expected_category: string;
  expected_priority: string;
  routed_model: string;
  actual_model: string;
  route_reason: string;
  latency_ms: number;
  tokens: number;
  cost_usd: number;
  baseline_cost_usd: number;
  savings_usd: number;
  fixed_model: string;
  fixed_latency_ms: number;
  fixed_cost_usd: number;
  match_score: number;
  passed: boolean;
  confidence: number;
  result_preview: string;
};

export type EvaluationSummary = {
  average_latency_ms: number;
  average_cost_usd: number;
  total_savings_usd: number;
  pass_rate: number;
  provider_coverage: string;
  provider_count: number;
  total_benchmarks: number;
};

export type MemoryPreferences = {
  name: string;
  signature: string;
  preferred_tone: string;
  default_model: string;
  tone_for_clients: string;
  tone_for_internal: string;
  common_instructions: string;
  updated_at: string;
};

export type MemoryPayload = {
  name: string;
  signature: string;
  preferred_tone: string;
  default_model: string;
  tone_for_clients: string;
  tone_for_internal: string;
  common_instructions: string;
};

export type ResourceState<T> = {
  data: T;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  source: "api" | "mock";
  refetch: () => Promise<void>;
};
