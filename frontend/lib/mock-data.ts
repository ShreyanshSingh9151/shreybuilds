import type {
  ActionRecord,
  DashboardSummary,
  Inbox,
  MemoryPreferences,
  RecentEmail
} from "@/lib/types";

// Use a fixed base timestamp to avoid SSR/client hydration drift.
const now = new Date("2026-04-07T11:00:00.000Z").getTime();

export const mockSummary: DashboardSummary = {
  connected_inboxes: 2,
  unread_count: 48,
  pending_replies: 9,
  total_ai_actions: 124,
  total_tokens: 26840,
  total_cost_usd: 0.2843,
  baseline_cost_usd: 0.4679,
  cost_savings_usd: 0.1836,
  avg_latency_ms: 742.4,
  model_usage: {
    gpt: 62,
    claude: 31,
    gemini: 31
  },
  action_usage: {
    summarize: 31,
    reply: 42,
    rewrite: 20,
    classify: 31
  },
  category_counts: {
    escalation: 11,
    finance: 8,
    general: 7,
    scheduling: 5
  }
};

export const mockActions: ActionRecord[] = [
  {
    id: "a1",
    provider: "gmail",
    thread_id: "th-1001",
    subject: "Q2 rollout timeline confirmation",
    sender: "nina@vertexlabs.com",
    action_type: "reply",
    selected_model: "auto",
    routed_model: "gpt",
    actual_model: "openrouter/openai/gpt-4o-mini",
    route_reason: "auto routed reply/rewrite to gpt-like profile for drafting quality",
    priority_reason: "Client asks for revised delivery dates within this week.",
    confidence: 0.89,
    action_items_count: 2,
    tokens_estimate: 1420,
    cost_estimate: 0.0284,
    baseline_cost_usd: 0.0426,
    cost_savings_usd: 0.0142,
    latency_ms: 870,
    timestamp: new Date(now - 1000 * 60 * 6).toISOString(),
    result_preview: "Drafted a concise client-facing reply with revised delivery dates."
  },
  {
    id: "a2",
    provider: "outlook",
    thread_id: "th-1002",
    subject: "Invoice approval for March campaign",
    sender: "finance@altius.co",
    action_type: "classify",
    category: "finance",
    selected_model: "claude",
    routed_model: "claude",
    actual_model: "openrouter/anthropic/claude-3.5-haiku",
    route_reason: "user-selected profile",
    priority_reason: "Invoice review request has billing deadline this week.",
    confidence: 0.93,
    action_items_count: 1,
    tokens_estimate: 680,
    cost_estimate: 0.0112,
    baseline_cost_usd: 0.0204,
    cost_savings_usd: 0.0092,
    latency_ms: 940,
    timestamp: new Date(now - 1000 * 60 * 14).toISOString(),
    result_preview: "finance"
  },
  {
    id: "a3",
    provider: "gmail",
    thread_id: "th-1003",
    subject: "Board meeting briefing notes",
    sender: "ceo@northstar.io",
    action_type: "summarize",
    category: "general",
    selected_model: "gpt",
    routed_model: "gpt",
    actual_model: "openrouter/openai/gpt-4o-mini",
    route_reason: "user-selected profile",
    priority_reason: "Executive briefing includes board-facing commitments.",
    confidence: 0.9,
    action_items_count: 3,
    tokens_estimate: 1980,
    cost_estimate: 0.0396,
    baseline_cost_usd: 0.0594,
    cost_savings_usd: 0.0198,
    latency_ms: 1120,
    timestamp: new Date(now - 1000 * 60 * 25).toISOString(),
    result_preview: "Generated a high-priority executive summary with action items."
  },
  {
    id: "a4",
    provider: "gmail",
    thread_id: "th-1004",
    subject: "Welcome email revision for onboarding",
    sender: "ops@mailpilot.ai",
    action_type: "rewrite",
    selected_model: "gemini",
    routed_model: "gemini",
    actual_model: "openrouter/google/gemini-2.0-flash",
    route_reason: "user-selected profile",
    priority_reason: "Onboarding message refresh requested before next hiring batch.",
    confidence: 0.86,
    action_items_count: 2,
    tokens_estimate: 910,
    cost_estimate: 0.0091,
    baseline_cost_usd: 0.0273,
    cost_savings_usd: 0.0182,
    latency_ms: 760,
    timestamp: new Date(now - 1000 * 60 * 38).toISOString(),
    result_preview: "Rewrote onboarding copy in a sharper, product-led tone."
  },
  {
    id: "a5",
    provider: "outlook",
    thread_id: "th-1005",
    subject: "Escalation: deployment stuck in staging",
    sender: "alerts@infrahub.dev",
    action_type: "classify",
    category: "escalation",
    selected_model: "auto",
    routed_model: "gemini",
    actual_model: "openrouter/google/gemini-2.0-flash",
    route_reason: "auto routed classify-style task to gemini-like profile for fast low-cost structure extraction",
    priority_reason: "Deployment blocker impacts production release timeline.",
    confidence: 0.96,
    action_items_count: 3,
    tokens_estimate: 720,
    cost_estimate: 0.0036,
    baseline_cost_usd: 0.0216,
    cost_savings_usd: 0.018,
    latency_ms: 640,
    timestamp: new Date(now - 1000 * 60 * 52).toISOString(),
    result_preview: "escalation"
  }
];

export const mockInboxes: Inbox[] = [
  {
    id: "in-1",
    provider: "gmail",
    email: "vatsal.demo@gmail.com",
    display_name: "Vatsal Demo",
    connected: true,
    unread_count: 31
  },
  {
    id: "in-2",
    provider: "outlook",
    email: "team@inboxmind.io",
    display_name: "InboxMind Team",
    connected: true,
    unread_count: 17
  }
];

export const mockEmails: RecentEmail[] = [
  {
    id: "e-1",
    provider: "gmail",
    thread_id: "th-1001",
    subject: "Contract amendment for annual plan",
    sender: "legal@brightforge.com",
    preview: "Please review the redlined changes before our 4 PM sync.",
    received_at: new Date(now - 1000 * 60 * 11).toISOString(),
    is_read: false,
    category: "client",
    priority: "high",
    ai_processed: true
  },
  {
    id: "e-2",
    provider: "outlook",
    thread_id: "th-1002",
    subject: "Budget request for ML compute",
    sender: "finance@company.com",
    preview: "Need approval for the April inference budget before Friday.",
    received_at: new Date(now - 1000 * 60 * 19).toISOString(),
    is_read: true,
    category: "finance",
    priority: "medium",
    ai_processed: true
  },
  {
    id: "e-3",
    provider: "gmail",
    thread_id: "th-1003",
    subject: "Customer escalated support ticket #4402",
    sender: "support@northstar.io",
    preview: "Enterprise customer reported a broken webhook during migration.",
    received_at: new Date(now - 1000 * 60 * 31).toISOString(),
    is_read: false,
    category: "escalation",
    priority: "critical",
    ai_processed: true
  }
];

export const mockMemory: MemoryPreferences = {
  name: "Vatsal Chaudhary",
  signature: "Best regards,\nVatsal Chaudhary",
  preferred_tone: "professional",
  default_model: "auto",
  tone_for_clients: "warm and consultative",
  tone_for_internal: "direct and concise",
  common_instructions: "Prioritize clarity, include clear next steps, and keep reply drafts under 140 words unless the email is strategic.",
  updated_at: new Date(now - 1000 * 60 * 90).toISOString()
};
