# MailPilot AI — Backend

Production-style demo backend for an AI email automation platform. Built in Go with Chi router, in-memory storage, and a modular architecture ready to split into microservices.

## Architecture

```
backend/
├── cmd/server/             # Application entry point
│   └── main.go             # Server bootstrap, seed data
├── internal/
│   ├── config/             # Environment config + .env loader
│   │   ├── config.go
│   │   └── dotenv.go
│   ├── models/             # DTOs and domain types
│   │   ├── dto.go          # Request/response shapes
│   │   ├── domain.go       # Core domain entities
│   │   └── dashboard.go    # Analytics models
│   ├── store/              # Thread-safe in-memory stores
│   │   ├── action_store.go # AI action records
│   │   ├── memory_store.go # User preferences
│   │   └── inbox_store.go  # Inboxes and emails
│   ├── providers/          # LLM provider interface + implementations
│   │   ├── provider.go     # Interface definition
│   │   ├── mock_gpt.go     # Mock GPT (structured, concise)
│   │   ├── mock_claude.go  # Mock Claude (nuanced, long-context)
│   │   ├── mock_gemini.go  # Mock Gemini (productivity-oriented)
│   │   ├── gemini.go       # Real Gemini API provider
│   │   ├── gemini_fallback.go  # Gemini with auto mock fallback
│   │   └── helpers.go      # Shared utilities
│   ├── services/           # Business logic
│   │   ├── model_router.go # Model selection & auto-routing
│   │   ├── email_ai.go     # AI action orchestration
│   │   ├── memory.go       # User preferences management
│   │   ├── analytics.go    # Dashboard metrics computation
│   │   └── inbox.go        # Inbox management
│   ├── handlers/           # HTTP request handlers
│   │   ├── health.go
│   │   ├── email_ai.go
│   │   ├── memory.go
│   │   ├── dashboard.go
│   │   ├── inbox.go
│   │   ├── helpers.go      # JSON response utilities
│   │   └── validation.go   # Request validation
│   ├── middleware/          # HTTP middleware
│   │   ├── logger.go       # Request logging
│   │   └── cors.go         # CORS configuration
│   ├── router/             # Route registration
│   │   └── router.go
│   └── utils/              # Shared utilities
│       └── utils.go
├── .env.example            # Environment template
├── .gitignore
├── go.mod
└── go.sum
```

## Quick Start

### Prerequisites
- Go 1.21+

### Setup

```bash
cd backend

# Copy env file and configure
cp .env.example .env
# Edit .env to add your Gemini API key (optional — mock responses work without it)

# Run directly
go run ./cmd/server

# Or build and run
go build -o mailpilot-server ./cmd/server
./mailpilot-server
```

The server starts on `http://localhost:8080` with 10 pre-seeded action records and 8 demo emails.

## API Endpoints

### Health
```
GET /health
```

### AI Actions
```
POST /api/v1/threads/summarize
POST /api/v1/threads/reply
POST /api/v1/threads/rewrite
POST /api/v1/threads/classify
```

### Memory (User Preferences)
```
GET  /api/v1/memory
POST /api/v1/memory/preferences
```

### Dashboard Analytics
```
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/actions?limit=20
GET /api/v1/dashboard/costs
GET /api/v1/dashboard/models
```

### Demo Inbox
```
GET /api/v1/inboxes
GET /api/v1/emails/recent
```

## Model Routing

In `auto` mode, actions are routed to the best-fit model:

| Action    | Default Model |
|-----------|---------------|
| summarize | claude        |
| reply     | gpt           |
| classify  | gemini        |
| rewrite   | gpt           |
| priority  | gemini        |
| actions   | claude        |

Users can override by specifying `"selected_model": "gpt"`, `"claude"`, or `"gemini"`.

## curl Examples

### Classify an email
```bash
curl -X POST http://localhost:8080/api/v1/threads/classify \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "thread_id": "thread_123",
    "subject": "Client escalation on delivery delay",
    "sender": "client@company.com",
    "content": "We are experiencing significant delays on deliverables. Our client is unhappy and has threatened escalation. We need an immediate action plan.",
    "selected_model": "auto",
    "tone": "professional",
    "length": "medium"
  }'
```

### Summarize a thread
```bash
curl -X POST http://localhost:8080/api/v1/threads/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "thread_id": "thread_456",
    "subject": "Q4 Budget Review",
    "sender": "finance@acmecorp.com",
    "content": "Hi team, please review the Q4 budget breakdown. Marketing is 15% over budget, engineering headcount needs adjustment, and travel budget needs approval.",
    "selected_model": "auto",
    "tone": "professional",
    "length": "medium"
  }'
```

### Generate a reply
```bash
curl -X POST http://localhost:8080/api/v1/threads/reply \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "thread_id": "thread_789",
    "subject": "Meeting follow-up",
    "sender": "john.smith@external.com",
    "content": "Hi, following up on our meeting. Can you send the updated project timeline? We need it for the board next week.",
    "selected_model": "auto",
    "tone": "professional",
    "length": "medium"
  }'
```

### Rewrite with a different tone
```bash
curl -X POST http://localhost:8080/api/v1/threads/rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "outlook",
    "thread_id": "thread_010",
    "subject": "Feedback on proposal",
    "sender": "colleague@company.com",
    "content": "Your proposal needs work. The numbers are off and the timeline is unrealistic. Fix it before the deadline.",
    "selected_model": "auto",
    "tone": "friendly",
    "length": "medium"
  }'
```

### Update user preferences
```bash
curl -X POST http://localhost:8080/api/v1/memory/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vatsal",
    "preferred_tone": "formal",
    "signature": "Best regards,\nVatsal\nMailPilot AI"
  }'
```

### Get dashboard summary
```bash
curl http://localhost:8080/api/v1/dashboard/summary
```

### Get cost breakdown
```bash
curl http://localhost:8080/api/v1/dashboard/costs
```

### Get recent actions
```bash
curl "http://localhost:8080/api/v1/dashboard/actions?limit=5"
```

### Get connected inboxes
```bash
curl http://localhost:8080/api/v1/inboxes
```

## LLM Providers

- **GPT (mock):** Structured, professional, concise responses
- **Claude (mock):** Nuanced, empathetic, long-context analysis
- **Gemini:** Real API when `GEMINI_API_KEY` is set, auto-falls back to mock on API errors

The provider interface (`LLMProvider`) makes it straightforward to add real OpenAI/Anthropic integrations later.

## Environment Variables

| Variable              | Default              | Description                     |
|-----------------------|----------------------|---------------------------------|
| PORT                  | 8080                 | Server port                     |
| ENVIRONMENT           | development          | Environment name                |
| CORS_ORIGIN_DASHBOARD | http://localhost:3000 | Dashboard frontend origin       |
| CORS_ORIGIN_EXTENSION | chrome-extension://* | Chrome extension origin         |
| GEMINI_API_KEY        | (empty)              | Google Gemini API key           |
| OPENAI_API_KEY        | (empty)              | OpenAI API key (future)         |
| CLAUDE_API_KEY        | (empty)              | Anthropic API key (future)      |
| GPT_COST_PER_1K       | 0.03                 | GPT cost per 1K tokens (USD)   |
| CLAUDE_COST_PER_1K    | 0.025                | Claude cost per 1K tokens (USD) |
| GEMINI_COST_PER_1K    | 0.001                | Gemini cost per 1K tokens (USD) |
