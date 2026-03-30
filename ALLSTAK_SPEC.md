# AllStak — Project Specification

> A unified observability and team collaboration platform for startups and small teams.
> Replaces Sentry + Datadog + UptimeRobot + Slack with a single product.

---

## Table of Contents

1. [Vision](#vision)
2. [Target Audience](#target-audience)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Pricing](#pricing)
6. [Architecture](#architecture)
7. [Database Design](#database-design)
8. [API Response Format](#api-response-format)
9. [Git Strategy](#git-strategy)
10. [Development Order](#development-order)
11. [Progress Tracking](#progress-tracking)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Java 25 & Spring Boot 4 — Key Changes](#java-25--spring-boot-4--key-changes)
14. [Testing & Validation Standards](#testing--validation-standards)
15. [Authentication for Testing](#authentication-for-testing)
16. [Filter & Search Validation Rules](#filter--search-validation-rules)
17. [Frontend–Backend Contract Integrity](#frontendbackend-contract-integrity)
18. [No Build / Live Debugging Workflow](#no-build--live-debugging-workflow)
19. [Definition of Done (Strict)](#definition-of-done-strict)
20. [Test Projects & SDK Validation](#test-projects--sdk-validation)

---

## Vision

AllStak is the **single home base** for engineering teams. Developers should never need to leave AllStak — errors, logs, monitors, servers, and team communication all live in one place.

```
Without AllStak:
  Developer → Sentry (errors)
  Developer → Datadog (logs)
  Developer → UptimeRobot (monitors)
  Developer → Slack (communication)

With AllStak:
  Developer → AllStak (everything)
```

---

## Target Audience

- **Primary:** Startups and small companies (5–50 developers)
- **Pain points we solve:**
  - Paying for 4+ separate tools
  - Jumping between apps to debug and communicate
  - Unpredictable pricing that spikes unexpectedly
  - Complex setup with no dedicated DevOps

---

## Tech Stack

```
Frontend:
├── Web          → React + Vite
└── Mobile       → React Native (iOS + Android)

Backend:         Spring Boot 4 (Java 25)
Auth:            Keycloak
Real-time:       WebSocket (built-in chat)

Databases:
├── PostgreSQL   → Transactional & relational data
└── ClickHouse   → Time-series & high-volume events

Messaging:       Apache Kafka (KRaft mode — no ZooKeeper)
Cache:           Redis
Hosting:         VPS (Hetzner or DigitalOcean)
CI/CD:           GitHub Actions
Branching:       GitFlow
```

### Frontend Monorepo Structure

```
packages/
├── shared/    ← API client, types, utils (shared between web and mobile)
├── web/       ← React + Vite
└── mobile/    ← React Native
```

Package manager: `pnpm workspaces`

---

## Features

### 🔴 Error Monitoring

| Feature | Details |
|---|---|
| Full stack trace | File, line number, function name |
| Error grouping | Fingerprint via hash of stack trace — same errors grouped together |
| User context | Who triggered the error: ID, email, IP |
| Error status | `unresolved` / `resolved` / `ignored` |
| Error frequency | Occurrence count, first seen, last seen |

### 🟡 Logs

| Feature | Details |
|---|---|
| Log levels | `debug` `info` `warn` `error` `fatal` |
| Filters | By service, level, time range |
| TTL Retention | 14 days / 30 days / 90 days depending on plan |
| Live tail | Real-time log streaming via WebSocket |

### 🟢 Website Monitor

| Feature | Details |
|---|---|
| HTTP/HTTPS check | GET request at configurable intervals (1 / 5 / 10 min) |
| Response time | Latency tracked per check |
| Downtime alerts | Immediate notification on failure |
| Public status page | `/status` page for each organization |

### 🔵 SSH Manager

| Feature | Details |
|---|---|
| Web terminal | xterm.js in the browser |
| Multi-server | Manage multiple servers from one place |
| Key-based auth | SSH keys encrypted at rest (AES-256) |
| Session audit log | Every session recorded in ClickHouse |

### 💬 Built-in Chat (Slack Replacement)

| Feature | Details |
|---|---|
| Channels | `#general`, `#production`, `#bugs`, custom channels |
| Error linking | Mention an error in chat → shows inline preview with details |
| Mentions | `@username` notifications |
| Push notifications | Mobile (iOS + Android) |
| In-app notifications | Web browser |

### 🔔 Alert & Notification System

#### Trigger Conditions

| Trigger | Config |
|---|---|
| **Error spike** | More than X errors in Y minutes (configurable per rule) |
| **New error** | First time a fingerprint is seen in this project |
| **Monitor down** | Immediately when a monitor check fails |
| **Monitor response time** | Response time exceeds X ms threshold |
| **SSH session started** | Any SSH session opened on a production server |

#### Notification Channels

| Channel | Provider | Status |
|---|---|---|
| **Email** | Azure Communication Services (Email) | Scaffold only |
| **Slack** | Webhook | Implemented |
| **Discord** | Webhook | Implemented |
| **Push (Mobile)** | OneSignal | Scaffold only |

#### User Controls

| Control | Details |
|---|---|
| Per project | Each project has its own alert rules |
| Per channel | Each rule sends to one or more specific channels |
| Quiet hours | No notifications sent between 11pm - 8am (user's timezone) |
| Severity filter | Rule can target: `critical` only or `all` severities |

### 🎬 Session Replay (Error-linked)

| Feature | Details |
|---|---|
| Trigger | Automatically captured when an error occurs |
| Recording window | Last 60 seconds before the error |
| Captured events | Clicks, navigations, console logs, failed network requests |
| Storage | ClickHouse - linked to error fingerprint |
| Viewing | "Watch Replay" button on error detail page |
| Retention | Same TTL as errors (plan-based) |
| Privacy | Sensitive inputs (password, credit card) automatically masked |

### 🌐 HTTP Request Monitoring

#### Inbound Request Tracking (APM)

Automatically tracks every incoming HTTP request to the application backend.

| Feature | Details |
|---|---|
| **Auto-capture** | SDK intercepts every request/response automatically — no manual instrumentation |
| **Request details** | Method, URL path, status code, duration (ms), request size, response size |
| **User context** | User ID attached if present in the request |
| **Trace ID** | Every request carries a `trace_id` that links it to related logs and errors |
| **Slow request detection** | Requests exceeding a configurable threshold are flagged as `slow` (default: 1000ms) |
| **Error linkage** | If a request throws an error, it is automatically linked to the error fingerprint |
| **Filters** | By method, status code group (2xx/3xx/4xx/5xx), path pattern, time range |
| **Percentiles** | P50 / P95 / P99 response times computed from ClickHouse |

#### Outbound Request Tracking

Automatically tracks every HTTP call made from the application to external services.

| Feature | Details |
|---|---|
| **Auto-capture** | SDK intercepts `fetch` / `XMLHttpRequest` / `axios` / `http.request` automatically |
| **Request details** | Method, full URL (host + path), status code, duration (ms) |
| **Failure detection** | Timeout, network error, 4xx/5xx from external service |
| **Trace linkage** | Shares the same `trace_id` as the inbound request that triggered it |
| **Top failing hosts** | Ranked list of external hosts with highest failure rates |

#### Error ↔ Request Linkage

Every error carries a `trace_id`. The same `trace_id` exists in `http_requests`, creating a direct bridge between an error and the full request context that caused it.

From the **Error Detail page**, a **"Request Context"** section shows:

| Field | Source |
|---|---|
| Method + Path | `http_requests.method` + `http_requests.path` |
| Status Code | `http_requests.status_code` |
| Duration | `http_requests.duration_ms` |
| Timestamp | `http_requests.timestamp` |
| User ID | `http_requests.user_id` |
| Outbound calls triggered | All `outbound` requests sharing the same `trace_id` — full request timeline |

#### SDK Behavior for Tracing

- SDK generates a `trace_id` at the start of every inbound request
- The same `trace_id` is propagated to all outbound calls within the same request lifecycle
- When capturing any error, the current `trace_id` is automatically attached to the error payload

### 💳 Billing (Moyasar)

Provider: Moyasar - https://api.moyasar.com/v1
Auth: HTTP Basic Auth using Secret Key
Supported: mada, Visa, Mastercard, Apple Pay

| Feature | Details |
|---|---|
| Invoice creation | Moyasar Invoices API - POST /invoices |
| Payment flow | AllStak creates invoice -> redirects user to Moyasar checkout -> webhook confirms |
| Webhook | Moyasar POSTs to AllStak callback_url on payment |
| Plan upgrade | User selects plan -> invoice created -> on payment confirmed -> plan updated in DB |
| Status | Scaffold only - no live credentials yet |

### ⚙️ Organization Settings

| Setting | Details |
|---|---|
| Name & slug | Rename workspace and update URL slug |
| Timezone | Used for quiet hours and timestamps display |
| Allowed email domains | Restrict signups to @company.com only |
| Export data | GDPR - export all org data as JSON/CSV |
| Danger zone | Permanently delete organization and all data |

### 🔑 API Key Management

| Feature | Details |
|---|---|
| Create key | Name + project association - raw key shown ONCE only |
| List keys | Name, project, last used at, created at |
| Revoke key | Permanently deletes - cannot be undone |
| Key format | `ask_live_` prefix for production, `ask_test_` for test |
| Storage | Only SHA-256 hash stored - raw key never saved |

---

## Team & Permissions

### Organization-Level Roles

| Role | Description |
|---|---|
| **Owner** | Full access + billing + delete org |
| **Admin** | Full access except billing |
| **Member** | Access granted per project manually |

### Project-Level Permissions

Each member gets individual permissions **per project**:

```
Member: Ahmed
├── Project: Production App
│   ├── Errors    ✅
│   ├── Logs      ✅
│   ├── Monitors  ❌
│   ├── SSH       ❌
│   └── Requests  ✅
└── Project: Staging
    └── All       ✅
```

Permissions per project:
- `errors` — view and manage errors
- `logs` — view logs
- `monitors` — view and manage monitors
- `ssh` — access SSH terminal (requires explicit grant by Owner/Admin)
- `requests` — view HTTP request monitoring and traces

> SSH access must always be explicitly granted — it is never inherited from other permissions.

---

## Pricing

### Plans

| Plan | Price | Target |
|---|---|---|
| **Free** | $0/mo | Individual developers, side projects |
| **Starter** | $19/mo | Small teams (2–5 devs) |
| **Pro** | $49/mo | Growing startups (5–20 devs) |
| **Scale** | $99/mo | Larger teams, unlimited everything |

### Plan Limits

| Limit | Free | Starter | Pro | Scale |
|---|---|---|---|---|
| Projects | 1 | 3 | 10 | Unlimited |
| Log retention | 3 days | 14 days | 30 days | 90 days |
| Errors/month | 1,000 | 20,000 | 100,000 | Unlimited |
| HTTP requests/month | 10,000 | 100,000 | 1,000,000 | Unlimited |
| Monitors | 5 | 20 | 100 | Unlimited |
| SSH servers | 0 | 2 | 10 | Unlimited |
| Team members | 1 | 5 | 20 | Unlimited |

### Annual Discount
All plans: **20% off** when billed annually.

### Competitive Comparison

| Tool | AllStak Pro $49 | Separate tools |
|---|---|---|
| Error Monitoring | ✅ | Sentry ~$26 |
| Logs | ✅ | Logtail ~$25 |
| Uptime Monitor | ✅ | UptimeRobot ~$7 |
| SSH Manager | ✅ | — |
| Team Chat | ✅ | Slack ~$8/user |
| **Total** | **$49** | **$66+** |

---

## Architecture

### Modular Monolith

Not microservices — a single deployable Spring Boot application split into independent modules internally. Each module owns its own package, service layer, and database access.

```
allstak/
├── backend/
│   └── src/main/java/com/allstak/
│       ├── AllStakApplication.java
│       ├── shared/
│       │   ├── config/
│       │   ├── security/
│       │   ├── exception/
│       │   └── utils/
│       ├── modules/
│       │   ├── auth/
│       │   ├── projects/
│       │   ├── errors/
│       │   ├── logs/
│       │   ├── monitors/
│       │   ├── ssh/
│       │   ├── chat/
│       │   └── requests/       ← HTTP request monitoring (inbound + outbound)
│       └── ingestion/          ← Kafka consumers + ClickHouse writers
│
├── packages/
│   ├── shared/
│   ├── web/
│   └── mobile/
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   └── nginx/
│
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

### Data Flow

```
SDK / App
    ↓
POST /ingest/v1/errors
    ↓
Kafka topic: allstak.errors
    ↓
Kafka Consumer (Spring Boot)
    ↓
ClickHouse (errors table)
```

---

## Database Design

### PostgreSQL — Transactional Data

```sql
-- Organizations
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  plan        VARCHAR(50) DEFAULT 'free',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users (keycloak_id is the link to Keycloak)
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_id  VARCHAR(255) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  org_id       UUID REFERENCES organizations(id),
  org_role     VARCHAR(50) DEFAULT 'member',  -- owner | admin | member
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  platform    VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- API Keys (for SDK ingestion)
CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id),
  key_hash     VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255),
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Project-level permissions per member
CREATE TABLE project_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id),
  user_id      UUID REFERENCES users(id),
  can_errors   BOOLEAN DEFAULT FALSE,
  can_logs     BOOLEAN DEFAULT FALSE,
  can_monitors BOOLEAN DEFAULT FALSE,
  can_ssh      BOOLEAN DEFAULT FALSE,
  can_requests BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Monitor configurations
CREATE TABLE monitor_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id),
  name            VARCHAR(255) NOT NULL,
  url             TEXT NOT NULL,
  interval_minutes INT DEFAULT 5,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- SSH server configurations
CREATE TABLE ssh_servers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id),
  name            VARCHAR(255) NOT NULL,
  host            VARCHAR(255) NOT NULL,
  port            INT DEFAULT 22,
  username        VARCHAR(255) NOT NULL,
  private_key_enc TEXT NOT NULL,  -- AES-256 encrypted
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Alert rules
CREATE TABLE alert_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id),
  type        VARCHAR(50) NOT NULL,  -- error_spike | monitor_down | etc
  config      JSONB NOT NULL,
  channels    JSONB NOT NULL,        -- [{ "type": "email", "to": "..." }]
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chat channels
CREATE TABLE chat_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),
  name        VARCHAR(100) NOT NULL,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID REFERENCES chat_channels(id),
  user_id     UUID REFERENCES users(id),
  content     TEXT NOT NULL,
  linked_error_id UUID,             -- optional link to an error
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### ClickHouse — Time-Series Data

```sql
-- Errors
CREATE TABLE errors (
  id            UUID DEFAULT generateUUIDv4(),
  project_id    UUID,
  fingerprint   String,
  message       String,
  stack_trace   String,
  level         LowCardinality(String),
  environment   LowCardinality(String),
  release       String,
  user_id       String,
  user_email    String,
  user_ip       String,
  trace_id      String,   -- links to http_requests table
  metadata      String,   -- JSON
  timestamp     DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL timestamp + INTERVAL 30 DAY;

-- HTTP Requests (inbound + outbound)
CREATE TABLE http_requests (
  id                UUID DEFAULT generateUUIDv4(),
  project_id        UUID,
  trace_id          String,
  direction         LowCardinality(String),  -- inbound | outbound
  method            LowCardinality(String),  -- GET | POST | PUT | DELETE | PATCH
  host              String,
  path              String,
  status_code       UInt16,
  duration_ms       UInt32,
  request_size      UInt32,
  response_size     UInt32,
  user_id           String,
  error_fingerprint String,                  -- linked error fingerprint, empty if none
  is_slow           UInt8,                   -- 1 if duration_ms > slow threshold
  timestamp         DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL timestamp + INTERVAL 30 DAY;

-- Logs
CREATE TABLE logs (
  id          UUID DEFAULT generateUUIDv4(),
  project_id  UUID,
  level       LowCardinality(String),
  message     String,
  service     LowCardinality(String),
  trace_id    String,
  metadata    String,   -- JSON
  timestamp   DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL timestamp + INTERVAL 14 DAY;

-- Monitor checks
CREATE TABLE monitor_checks (
  monitor_id       UUID,
  project_id       UUID,
  status           UInt8,    -- 1=up, 0=down
  response_time_ms UInt32,
  status_code      UInt16,
  timestamp        DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (monitor_id, timestamp)
TTL timestamp + INTERVAL 90 DAY;

-- SSH audit log
CREATE TABLE ssh_audit_logs (
  id          UUID DEFAULT generateUUIDv4(),
  server_id   UUID,
  project_id  UUID,
  user_id     UUID,
  command     String,
  output      String,
  timestamp   DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL timestamp + INTERVAL 90 DAY;
```

---

## API Response Format

### Client API (React/Mobile → Backend)

**Success:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 340
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this project",
    "details": {}
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

**Client Error Codes:**

| Code | HTTP Status |
|---|---|
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 422 |
| `INTERNAL_ERROR` | 500 |

---

### SDK / Ingestion API (App → AllStak)

Authenticated via `API Key` in header: `X-AllStak-Key: <key>`

**Success:**
```json
{
  "ok": true,
  "id": "evt_abc123"
}
```

**Error:**
```json
{
  "ok": false,
  "code": "RATE_LIMITED",
  "retryAfter": 60
}
```

**SDK Error Codes:**

| Code | HTTP Status | Meaning |
|---|---|---|
| `INVALID_API_KEY` | 401 | Bad or missing key |
| `RATE_LIMITED` | 429 | Too many requests |
| `PAYLOAD_TOO_LARGE` | 413 | Body exceeds limit |
| `INTERNAL_ERROR` | 500 | Server error |

**SDK Behavior Contract:**
- Timeout: max 3 seconds
- On failure: buffer locally and retry with exponential backoff
- Must NEVER block or crash the host application

---

## Git Strategy

### GitHub Organization

```
Organization: https://github.com/AllStak

Repositories:
├── AllStak/allstak          ← main monorepo (backend + frontend + infra)
├── AllStak/allstak-js       ← JavaScript/TypeScript SDK
├── AllStak/allstak-java     ← Java SDK
└── AllStak/allstak-python   ← Python SDK
```

---

### GitFlow — Branch Structure

```
main          ← production only — NEVER push directly
develop       ← staging — all features merge here first
feature/*     ← new features (Claude Agent works here)
fix/*         ← bug fixes
release/*     ← release candidates before going to main
hotfix/*      ← critical production fixes only
```

#### Branch Naming Rules

Every branch name must follow this pattern exactly — no exceptions:

```
feature/module-short-description
fix/module-short-description
release/vX.Y.Z
hotfix/short-description

Examples:
  feature/auth-jwt-setup
  feature/errors-ingest-endpoint
  feature/logs-clickhouse-writer
  fix/auth-token-expiry
  release/v1.0.0
  hotfix/errors-fingerprint-crash
```

> Claude Agent must always create a new branch before starting any task.
> Never commit directly to `develop` or `main`.

---

### Tags — Versioning

Semantic Versioning is mandatory. Every merge from `develop` → `main` must have a tag.

```
vMAJOR.MINOR.PATCH

v1.0.0   ← initial release
v1.0.1   ← patch: bug fix
v1.1.0   ← minor: new feature added
v2.0.0   ← major: breaking change

Tag format examples:
  v1.0.0
  v1.0.1
  v1.2.0
```

#### How to tag a release

```bash
# After merging develop → main
git checkout main
git pull
git tag -a v1.0.0 -m "release: v1.0.0 — auth + error monitoring"
git push origin v1.0.0
```

Tag message must describe what is in the release in one line.

---

### Commit Message Rules

Every commit must follow this format — Claude Agent must respect this strictly:

```
type(module): short description

Types:
  feat      — new feature
  fix       — bug fix
  refactor  — code change, no new feature or fix
  test      — adding or updating tests
  docs      — documentation only
  chore     — build, config, dependencies
  perf      — performance improvement

Modules:
  auth | projects | errors | logs | monitors | ssh | chat | infra | shared

Examples:
  feat(errors): add fingerprint generation for stack traces
  fix(auth): handle expired Keycloak token gracefully
  feat(logs): write log events to ClickHouse via Kafka consumer
  chore(infra): add docker-compose healthchecks
  test(errors): add unit tests for fingerprint service
  refactor(shared): extract pagination helper to utils
```

> Single responsibility per commit — one logical change per commit, not multiple unrelated changes bundled together.

---

### Pull Request Rules

Every PR must follow this template:

```markdown
## What does this PR do?
Short description of the change.

## Module
auth | errors | logs | monitors | ssh | chat | infra | shared

## Type
feat | fix | refactor | test | chore

## Checklist
- [ ] Branch name follows naming convention
- [ ] Commit messages follow convention
- [ ] Tests added/updated if business logic changed
- [ ] No direct ClickHouse writes (always via Kafka)
- [ ] No secrets or API keys in code
```

---

### Branch Protection Rules

#### `main` branch
- No direct push — ever
- Require pull request from `release/*` or `hotfix/*` only
- Require CI to pass (all jobs green)
- Require manual approval before merge
- Merge → immediately triggers production deploy + tag

#### `develop` branch
- No direct push
- Require pull request from `feature/*` or `fix/*`
- Require CI to pass
- Merge → automatically deploys to staging

---

### Full Git Flow Example

```
1. Start new feature
   git checkout develop
   git pull
   git checkout -b feature/errors-ingest-endpoint

2. Work and commit
   git add .
   git commit -m "feat(errors): add POST /ingest/v1/errors endpoint"
   git commit -m "feat(errors): publish error events to Kafka topic"
   git commit -m "test(errors): add unit test for ingest validation"

3. Push and open PR → develop
   git push origin feature/errors-ingest-endpoint
   # Open PR on GitHub: feature/errors-ingest-endpoint → develop

4. CI runs automatically on PR
   ├── Build passes ✅
   └── Tests pass ✅

5. Merge to develop → staging deploys automatically

6. When ready to release
   git checkout -b release/v1.1.0 from develop
   # Open PR: release/v1.1.0 → main
   # Manual approval required

7. Merge to main → production deploys
   git tag -a v1.1.0 -m "release: v1.1.0 — error monitoring complete"
   git push origin v1.1.0
```

---

## Development Order

> Backend first — always. Frontend and mobile come after the backend module is complete and tested.

```
Phase 1 — Foundation
├── Backend: Project setup (Spring Boot 4, Java 25, Gradle)
├── Backend: Docker + docker-compose (Postgres, ClickHouse, Kafka, Redis)
├── Backend: Flyway migrations — core tables
├── Backend: Keycloak integration + JWT filter
└── Backend: Health check endpoint (/actuator/health)

Phase 2 — Core: Error Monitoring
├── Backend: Kafka topic setup (allstak.errors)
├── Backend: POST /ingest/v1/errors endpoint
├── Backend: Kafka consumer → ClickHouse writer
├── Backend: GET /api/v1/errors (list, filter, detail)
├── Backend: Error fingerprinting service
└── Backend: Error status update (resolve/ignore)

Phase 3 — Core: Logs
├── Backend: POST /ingest/v1/logs
├── Backend: Kafka consumer → ClickHouse writer
└── Backend: GET /api/v1/logs (list, filter, live tail via WebSocket)

Phase 3.5 — Core: HTTP Request Monitoring
├── Backend: Kafka topic setup (allstak.http_requests)
├── Backend: POST /ingest/v1/http-requests endpoint (batch, API key auth)
├── Backend: Kafka consumer → ClickHouse writer (HttpRequestKafkaConsumer)
├── Backend: GET /api/v1/http-requests (list, filter by direction/method/status/path/time)
├── Backend: GET /api/v1/http-requests/stats (P50/P95/P99, error rate, total count)
├── Backend: GET /api/v1/http-requests/top-hosts (ranked by failure rate, outbound only)
├── Backend: GET /api/v1/http-requests/by-trace?traceId= (full request timeline)
├── Backend: Slow request threshold config (default: 1000ms, configurable per project)
└── Backend: Error linkage — error detail endpoint includes linked inbound request via trace_id

Phase 4 — Core: Website Monitor
├── Backend: Monitor config CRUD
├── Backend: Scheduler (check every X minutes)
├── Backend: Store results in ClickHouse
└── Backend: Downtime alert trigger

Phase 5 — Core: SSH Manager
├── Backend: SSH server config CRUD (encrypted keys)
├── Backend: WebSocket terminal session
└── Backend: Audit log writer to ClickHouse

Phase 6 — Team & Permissions
├── Backend: Organization + project CRUD
├── Backend: Project-level permissions
└── Backend: API Keys management

Phase 7 — Chat
├── Backend: Channel CRUD
├── Backend: WebSocket message broker
└── Backend: Error linking in messages

Phase 8 — Alerts & Notifications
├── Backend: AlertRuleService — CRUD for rules per project
├── Backend: AlertEvaluationService — evaluate triggers
├── Backend: NotificationDispatcherService — route to channels
├── Backend: Slack + Discord webhooks (implemented)
├── Backend: Email (Azure scaffold) + Push (OneSignal scaffold)
└── Backend: Integration with Error, Monitor, SSH, HTTP Request modules

Alert triggers include:
  - error_spike | new_error | monitor_down | monitor_response_time | ssh_session_started
  - http_error_rate     — more than X% of requests return 4xx/5xx in last Y minutes
  - http_slow_endpoint  — P95 response time exceeds X ms
  - http_outbound_down  — more than X consecutive failures to a specific external host

Phase 9 — Session Replay
├── Backend: ClickHouse table for replay_events
├── Backend: POST /ingest/v1/replay endpoint
├── Backend: GET /api/v1/errors/{fingerprint}/replay
└── Backend: ReplayKafkaConsumer → ClickHouseWriter

Phase 10 — Billing (Moyasar)
├── Backend: PostgreSQL tables (subscriptions, invoices)
├── Backend: MoyasarInvoiceService — create invoice via API
├── Backend: POST /api/v1/billing/upgrade — create invoice + return checkout URL
├── Backend: POST /webhooks/moyasar — handle payment webhook
├── Backend: PlanEnforcementService — check limits per plan
└── Backend: Scaffold only — no live credentials

Phase 11 — Organization Settings
├── Backend: PATCH /api/v1/org/settings
├── Backend: POST /api/v1/org/export — GDPR data export
├── Backend: DELETE /api/v1/org — danger zone delete
└── Backend: Allowed domains enforcement on registration

Phase 12 — API Key Management
├── Backend: POST /api/v1/api-keys (name + expose raw key once)
├── Backend: GET /api/v1/api-keys?projectId=
├── Backend: DELETE /api/v1/api-keys/{id}
└── Backend: PATCH /api/v1/api-keys/{id} — rename

Phase 13 — Frontend Web (React)
└── React: All modules above

Phase 14 — Mobile (React Native)
└── React Native: All modules above

Phase 15 — SDKs
├── allstak-js
├── allstak-java
└── allstak-python
```

---

## Progress Tracking

All progress is tracked in the `progress/` folder at the root of the repository.

```
allstak/
└── progress/
    ├── README.md              ← overall status dashboard
    ├── phase-1-foundation.md
    ├── phase-2-errors.md
    ├── phase-3-logs.md
    ├── phase-4-monitors.md
    ├── phase-5-ssh.md
    ├── phase-6-teams.md
    ├── phase-7-chat.md
    ├── phase-8-web.md
    ├── phase-9-mobile.md
    └── phase-10-sdks.md
```

### progress/README.md format

```markdown
# AllStak — Development Progress

Last updated: YYYY-MM-DD

## Overall Status

| Phase | Status | Branch | Notes |
|---|---|---|---|
| Phase 1 — Foundation | ✅ Done | — | |
| Phase 2 — Error Monitoring | 🔄 In Progress | feature/errors-ingest-endpoint | |
| Phase 3 — Logs | ⏳ Pending | — | |
| Phase 4 — Website Monitor | ⏳ Pending | — | |
| Phase 5 — SSH Manager | ⏳ Pending | — | |
| Phase 6 — Teams & Permissions | ⏳ Pending | — | |
| Phase 7 — Chat | ⏳ Pending | — | |
| Phase 8 — Frontend Web | ⏳ Pending | — | |
| Phase 9 — Mobile | ⏳ Pending | — | |
| Phase 10 — SDKs | ⏳ Pending | — | |

## Status Legend
✅ Done | 🔄 In Progress | ⏳ Pending | ❌ Blocked
```

### Per-phase file format (example: phase-2-errors.md)

```markdown
# Phase 2 — Error Monitoring

Status: 🔄 In Progress
Branch: feature/errors-ingest-endpoint
Started: YYYY-MM-DD
Completed: —

## Tasks

- [x] Kafka topic: allstak.errors
- [x] POST /ingest/v1/errors endpoint
- [x] Input validation
- [ ] Kafka consumer → ClickHouse writer
- [ ] Error fingerprinting service
- [ ] GET /api/v1/errors
- [ ] Error status update (resolve/ignore)
- [ ] Unit tests for fingerprint logic

## Notes
Any blockers, decisions made, or things to revisit.
```

> Claude Agent must update the relevant progress file after completing each task.
> The progress folder is the source of truth for what has been done and what is next.

---



### ci.yml — Runs on every Pull Request

```
Triggers: PR to main or develop

Jobs:
├── backend
│   ├── Setup Java 25
│   ├── Run tests (./gradlew test)
│   └── Build Docker image
└── frontend
    ├── Setup Node 20
    ├── npm ci
    ├── Lint
    └── Build
```

### deploy.yml — Runs on merge to main

```
Steps:
1. Build Docker images
2. Push to GitHub Container Registry (ghcr.io)
3. SSH into VPS
4. docker compose pull
5. docker compose up -d
6. Health check — verify /actuator/health returns 200
```

> If health check fails → automatic rollback to previous image.

### Testing Strategy

Focus tests on **real business logic only**:

```
✅ Write tests for:
├── Error fingerprint generation
├── Project permission checks
├── Alert rule evaluation
└── Monitor status calculation (up/down logic)

❌ Skip tests for:
├── Simple CRUD endpoints
├── DTO mapping
└── Config classes
```

---

## Java 25 & Spring Boot 4 — Key Changes

### Java 25 (LTS — Released September 16, 2025)

Java 25 is the new Long-Term Support release, succeeding Java 21. Oracle provides at least 8 years of support.

#### Finalized Features

| Feature | What it means for AllStak |
|---|---|
| **Virtual Threads** (from Java 21, now stable) | Use for SSH connections and Website Monitor — handles thousands of blocking I/O connections efficiently |
| **Scoped Values** | Safe, immutable data sharing across threads — modern replacement for `ThreadLocal`. Useful for passing request context (user ID, project ID) through the call stack |
| **Structured Concurrency** (preview) | Treat multiple concurrent tasks as a single unit — simplifies error handling in parallel operations |
| **Compact Object Headers** | Object headers reduced from 96–128 bits to 64 bits — lower memory usage out of the box |
| **Flexible Constructor Bodies** | More natural constructor logic before `super()` calls |
| **Module Import Declarations** | `import module java.base;` — cleaner imports in utility classes |
| **Compact Source Files** | Write scripts without class declarations — useful for tooling and scripts |
| **Key Derivation Function API** | Built-in KDF support — relevant for API key hashing and SSH key handling |

#### Preview Features (do not use in production)

- **Primitive Types in Patterns** — `instanceof int i` in pattern matching
- **Stable Values** — lazily initialized constants optimized by JVM
- **PEM Encodings API** — built-in PEM encode/decode for SSH keys (watch this — useful when stable)
- **Structured Concurrency** — still preview, avoid in production code

#### Performance Improvements

- **AOT Method Profiling** — JIT compiler uses profiles from previous runs, reducing warm-up time significantly. Important for fast container restarts on VPS.
- **Generational ZGC** — low-latency garbage collector, now a product feature
- **JFR Enhancements** — better CPU profiling and method timing for production diagnostics

---

### Spring Boot 4 (Released November 20, 2025)

Built on **Spring Framework 7** and **Jakarta EE 11**.

#### Platform Changes

| Change | Impact |
|---|---|
| **Minimum Java version: 17** | We use Java 25 — fully supported with "first-class" designation |
| **Jakarta EE 11** | All `javax.*` imports are now `jakarta.*` — ensure no old imports remain |
| **Jackson 3** is now the default | Jackson 2 converters still available but deprecated |
| **Gradle 9** supported | Update build scripts accordingly |
| **Kotlin 2.2** baseline | Not applicable (using Java) |

#### Modularization

Auto-configuration is no longer one large JAR. It is split into focused modules:

```
Before: spring-boot-autoconfigure (massive jar with everything)
After:  smaller focused modules per feature

Benefit:
├── Faster startup
├── Lower memory usage
├── Cleaner dependency tree
└── No unused auto-config loading at startup
```

As a developer using starters (`spring-boot-starter-web`, etc.), no changes needed.

#### API Versioning — Built-in

No more manually hardcoding `/v1/` in every URL:

```java
// Old way (Spring Boot 3)
@GetMapping("/api/v1/errors")

// New way (Spring Boot 4)
@GetMapping("/errors")
@RequestMapping(version = "v1")
```

Versioning strategy can be changed (URL path / header / param) without touching every controller.

#### Null Safety — JSpecify

Spring Framework 7 fully adopts JSpecify annotations:

```java
// Code is now null-aware at compile time
@NonNull String message       // guaranteed not null
@Nullable String userId       // may be null — IDE/compiler warns if you don't check
@NullMarked                   // entire class/package is null-aware
```

Benefit: NullPointerExceptions caught at compile time by the IDE, not at 3am in production.

#### HTTP Service Clients — Built-in

Declare an interface, Spring generates the implementation:

```java
@HttpExchange(url = "https://hooks.slack.com")
public interface WebhookClient {
  @PostExchange("/services/{id}")
  void send(@PathVariable String id, @RequestBody WebhookPayload payload);
}
```

Replaces manual `RestTemplate` / `WebClient` boilerplate for outbound HTTP calls (webhook delivery, etc.).

#### OpenTelemetry Starter

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-opentelemetry</artifactId>
</dependency>
```

Auto-configures metrics + traces export over OTLP with zero extra setup. Relevant for AllStak's own internal observability.

#### Kafka — ZooKeeper Removed

Spring for Apache Kafka 4.0 removes ZooKeeper support entirely. **KRaft mode only.**

```yaml
# docker-compose.yml — use KRaft mode
KAFKA_PROCESS_ROLES: broker,controller
```

`EmbeddedKafkaZKBroker` is gone — use `EmbeddedKafkaKraftBroker` in tests.

#### Spring Security 7

- Full alignment with Spring Framework 7's null-safety model
- Updated authorization model

#### Key Dependency Versions in Spring Boot 4

| Dependency | Version |
|---|---|
| Spring Framework | 7.0 |
| Spring Security | 7.0 |
| Spring Data | 2025.1 |
| Spring Kafka | 4.0 |
| Micrometer | 1.16 |
| Jackson | 3.x |
| Reactor | 2025.0 |
| GraalVM (if native) | 25+ |

---

## Build Notes for AllStak

```gradle
// build.gradle
java {
  toolchain {
    languageVersion = JavaLanguageVersion.of(25)
  }
}

dependencies {
  // Core
  implementation 'org.springframework.boot:spring-boot-starter-web'
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
  implementation 'org.springframework.boot:spring-boot-starter-security'
  implementation 'org.springframework.boot:spring-boot-starter-websocket'
  implementation 'org.springframework.boot:spring-boot-starter-actuator'
  implementation 'org.springframework.boot:spring-boot-starter-opentelemetry'

  // Kafka
  implementation 'org.springframework.kafka:spring-kafka'

  // Redis
  implementation 'org.springframework.boot:spring-boot-starter-data-redis'

  // Database
  implementation 'org.postgresql:postgresql'
  implementation 'org.flywaydb:flyway-core'  // DB migrations

  // ClickHouse
  implementation 'com.clickhouse:clickhouse-jdbc:0.6.x'

  // Keycloak
  implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'

  // Null safety
  implementation 'org.jspecify:jspecify:1.0.0'

  // SSH
  implementation 'org.apache.sshd:sshd-core:2.x'

  // Testing
  testImplementation 'org.springframework.boot:spring-boot-starter-test'
  testImplementation 'org.springframework.kafka:spring-kafka-test'
}
```

---

## Testing & Validation Standards

Every feature must pass the following validation gates before it is considered complete. No exceptions.

### A) Chrome MCP Testing (MANDATORY)

- All UI features **must** be tested using Chrome MCP (Chrome DevTools Protocol)
- Testing is performed through the actual running browser — never from code assumptions alone
- Required steps for every feature:
  - Open the running application in the browser
  - Open DevTools → Network tab
  - Inspect real HTTP requests and responses
  - Verify request payloads match expected parameters
  - Verify response bodies match expected DTOs
  - Confirm visual behavior matches design reference

### B) Network Validation Rules

- No excessive or duplicate requests on page load or interaction
- No request loops (e.g., infinite re-fetching caused by state changes)
- No unnecessary polling unless explicitly designed (e.g., live tail)
- Search inputs **must** use debounce (minimum 300ms) — no request per keystroke
- Filters must not trigger multiple duplicate requests on a single change
- Every request must be traceable to an actual user action or a deliberate state change

### C) Real Data Only

- Dummy, mock, placeholder, or hardcoded data is **strictly forbidden** in production UI
- All data displayed in the UI must come from backend API responses
- No fallback fake UI states (e.g., hardcoded cards, sample charts, static lists)
- If the backend returns empty data, the UI must show a proper empty state — not fake content

### D) Mandatory Manual Testing

Every feature must be manually tested for:

- **UI correctness** — layout, spacing, colors, responsiveness match design reference
- **API correctness** — correct endpoints called, correct parameters sent, correct data rendered
- **Edge cases** — empty states, error states, loading states, permission-denied states
- **Combined filters / interactions** — multiple filters applied together, reset behavior, pagination with filters

---

## Authentication for Testing

### Standard Test Account

All development and QA testing must use the following account:

```
Email:    test@allstak.io
Password: 12345678
```

### Rules

- Must log in via the UI login flow — no authentication bypass or token injection
- Must validate authenticated requests in the Network tab (Authorization header present and valid)
- All dashboard, feature, and settings testing must be performed under an authenticated session
- No testing as guest/unauthenticated user unless explicitly required for that specific test case
- If the test account does not exist in the environment, create it through the standard registration flow first

---

## Filter & Search Validation Rules

### Filter Requirements

- All filters displayed in the UI **must** be connected to backend query parameters
- Every filter must be tested individually (single filter applied, correct request sent)
- Every filter must be tested in combination (multiple filters applied simultaneously)
- Filter values must be reflected in the URL or request params — no client-side-only filtering on full datasets

### Search Requirements

- Search must be debounced (minimum 300ms delay after last keystroke)
- Must NOT send a request per keystroke
- Search query must be sent as a query parameter to the backend
- Empty search must restore the unfiltered state

### Reset Behavior

- "Reset filters" or "Clear all" must restore the default state completely
- After reset, the UI must trigger a fresh request with default parameters
- No stale filter state may persist after reset

### General

- No silent failures — if a filter or search request fails, the UI must display an error state
- No client-side filtering as a substitute for backend filtering (unless explicitly documented as intentional)

---

## Frontend–Backend Contract Integrity

- The frontend must **never** assume or invent API response structures
- All frontend types and interfaces must align with actual backend DTOs and response formats
- The API response format defined in this spec (see [API Response Format](#api-response-format)) is the contract — both sides must honor it
- If a mismatch is discovered between frontend expectations and backend responses:
  - **Option A:** Fix the backend to match the agreed contract
  - **Option B:** Update frontend types to match the actual backend response
  - **Never:** Apply temporary hacks, field remapping workarounds, or `any` type casts to suppress mismatches
- Type mismatches must be resolved immediately — they are treated as bugs, not technical debt
- When adding a new API integration, the developer must inspect the actual backend response (via Network tab) before writing frontend types

---

## No Build / Live Debugging Workflow

- When the application is already running (e.g., `localhost:3000` for frontend, `localhost:8080` for backend), use the live instance directly
- Do not rebuild or restart the dev server unnecessarily — Vite HMR handles frontend changes automatically
- Debug directly in the live environment using Chrome DevTools
- Validate changes immediately in the browser after saving — do not wait for a full rebuild cycle
- If a rebuild is required (e.g., config change, new dependency), perform it once and return to live debugging
- Use the Network tab, Console, and Elements panel as primary debugging tools — not `console.log` guesswork

---

## Definition of Done (Strict)

A feature is **NOT** considered complete unless **all** of the following criteria are met:

- [ ] UI matches the design reference (layout, colors, spacing, typography)
- [ ] No dummy, mock, or placeholder data exists anywhere in the feature
- [ ] All i18n translation keys are applied (both `en.json` and `ar.json`)
- [ ] All filters, search, and interactive elements function correctly
- [ ] No excessive, duplicate, or looping network requests
- [ ] Chrome MCP testing is completed (Network tab inspected, requests verified)
- [ ] No console errors or warnings related to the feature
- [ ] All data is fetched from real backend APIs
- [ ] Behavior is verified manually in the browser under an authenticated session
- [ ] Edge cases are tested (empty state, error state, loading state, permission denied)
- [ ] Combined interactions are tested (multiple filters, pagination + filters, search + filters)

> No feature moves to "Done" status in the progress tracker until every item above is checked.

---

---

## Test Projects & SDK Validation

### A) Test Projects

**Path:** `C:\Users\iRovler\Desktop\MyProjects\allstak-test-projects`

Rules:
- Must be used for real-world validation of every observability feature
- Must send real logs, errors, and events to AllStak via `allstak-js` SDK
- Must simulate real application behavior (not synthetic/mock payloads)
- Test script: `test-sdk.mjs` — sends logs (info, warn, error), captures exceptions, and sends messages

### B) SDK Validation Rules

Using **allstak-js** (`C:\Users\iRovler\Desktop\MyProjects\allstak-js`):

- Must test log ingestion end-to-end (SDK → Kafka → ClickHouse → API → Dashboard)
- Must confirm logs reach the backend (check `/api/v1/logs` response)
- Must confirm logs appear in the dashboard UI (Chrome MCP screenshot verification)
- Must validate all fields:
  - `level` — debug, info, warn, error (all levels must render correctly)
  - `message` — full message text must appear in UI
  - `service` — service name must appear in SERVICE column and be filterable
  - `metadata` — must be parseable and visible in expanded row detail
  - `timestamp` — must display in `YYYY-MM-DD HH:mm:ss.mmm` format

### C) End-to-End Observability Validation

The full data flow must be verified at each step:

```
allstak-js SDK  →  POST /ingest/v1/logs (X-AllStak-Key header)
                →  Kafka topic: allstak.logs
                →  LogKafkaConsumer → LogClickHouseWriter
                →  ClickHouse: allstak.logs table
                →  GET /api/v1/logs (JWT auth, query params)
                →  Dashboard UI (React, real data rendered)
```

Each step must be verified — not assumed. If logs don't appear in the dashboard, trace backwards through the pipeline.

### D) Search Validation Rule

Search is **NOT** considered complete unless **all** of the following are true:

- [ ] Works from the UI (type in search input → results filter in real time after debounce)
- [ ] Works from the API directly (`/api/v1/logs?search=keyword` returns filtered results)
- [ ] Works on real logs sent via SDK (not empty dataset or synthetic test data)
- [ ] Works with partial matches (e.g. `mem` matches "Memory usage high")
- [ ] Works combined with other filters (level + search, timeRange + search)
- [ ] Backend performs the filtering (ILIKE on `message` and `service` columns in ClickHouse)
- [ ] No client-side filtering as substitute for backend search
- [ ] Response `total` count reflects filtered count, not full dataset count

### E) Live Tail Validation Rules

Live Tail is **NOT** considered complete unless **all** of the following are true:

- [ ] Uses WebSocket (`/api/v1/logs/tail?projectId=<uuid>`) — not polling or fake streaming
- [ ] Tested with real incoming logs sent via `allstak-js` SDK over time (not a single batch)
- [ ] Validated using Chrome MCP under an authenticated session
- [ ] New logs appear in the table automatically without manual page refresh
- [ ] Level filter works during Live Tail (only matching levels shown)
- [ ] Service filter works during Live Tail (only matching services shown)
- [ ] Search filter works during Live Tail (only matching messages/services shown)
- [ ] Pause button stops new logs from appearing; Resume flushes buffered logs
- [ ] Clear button removes all live logs from the table
- [ ] Toggle OFF closes WebSocket and switches back to historical REST data
- [ ] Toggle ON re-opens WebSocket and starts fresh live stream
- [ ] No polling spam — WebSocket is the only live data transport
- [ ] No duplicate log rows from the same WebSocket session
- [ ] Status bar shows real connection state (Connecting / Streaming / Paused)
- [ ] No hardcoded dummy streaming text (e.g. "3 new logs/sec")
- [ ] Counter reflects actual received log count
- [ ] Zero console errors during live streaming
- [ ] Test script: `allstak-test-projects/test-live-tail.mjs` sends 12 logs every 3s across 3 services

**Live Tail data flow:**

```
allstak-js SDK  →  POST /ingest/v1/logs (X-AllStak-Key header)
                →  Kafka topic: allstak.logs
                →  LogKafkaConsumer:
                     1. LogClickHouseWriter (persistence)
                     2. LogTailBroadcaster.broadcast(event) (real-time)
                →  WebSocket /api/v1/logs/tail (per-project sessions)
                →  Dashboard useLiveLogs hook (append to state)
                →  LogsTable renders new rows at top
```

### F) Monitors Feature Validation Rules

Monitors page is **NOT** considered complete unless **all** of the following are true:

- [ ] UI matches `ui/dashboard/monitors.html` reference (cards, summary bar, modal, actions)
- [ ] All data from real backend — no dummy monitors, no fake uptime, no fake response times
- [ ] Backend enriches list response with live status, uptime%, and response time from ClickHouse checks
- [ ] Monitor health checks run automatically via `MonitorScheduler` (every 60s for active monitors)
- [ ] Create monitor works via modal → `POST /api/v1/monitors` → list refresh
- [ ] Pause/Resume works via `PUT /api/v1/monitors/{id}` with `isActive` toggle
- [ ] Delete works via `DELETE /api/v1/monitors/{id}?projectId=...` → list refresh
- [ ] Status badges reflect real state: UP (green), DOWN (red), PAUSED (gray), PENDING (gray)
- [ ] Response time shows actual ms from latest health check, or TIMEOUT for down monitors
- [ ] Uptime percentage computed from ClickHouse check history (24h window)
- [ ] Each mutation (create/pause/delete) triggers exactly 1 refetch — no spam
- [ ] All text uses i18n keys (en + ar)
- [ ] Empty state shown when no monitors exist
- [ ] Loading skeleton shown during initial fetch
- [ ] Zero console errors
- [ ] Chrome MCP network tab validated

### G) Chat Feature Validation Rules

Chat is **NOT** considered complete unless **all** of the following are true:

- [ ] UI matches `ui/chat.html` reference (sidebar, channels, message area, composer, mentions)
- [ ] All new organizations automatically get default channels (general, production, bugs) via auto-creation on first load
- [ ] Chat uses real backend data only — no dummy channels, no fake messages, no placeholder users
- [ ] Messages include `userName` from sender (stored in DB, not resolved client-side)
- [ ] @mentions render with teal highlight (primary-ghost background, primary-text color)
- [ ] @mentions parsed from content via `/@\w+/g` regex — stored as plain text
- [ ] WebSocket real-time delivery implemented at `/api/v1/chat/ws?channelId=<uuid>`
- [ ] Message send via REST `POST /api/v1/chat/channels/{channelId}/messages`, broadcast via WebSocket
- [ ] Channel switching loads messages correctly without stale data
- [ ] Message composer supports Enter to send, Shift+Enter for newline
- [ ] Date dividers (Today/Yesterday/date) render correctly between message groups
- [ ] Same-author message grouping within 5 minutes (continuation style without avatar)
- [ ] Empty state shown when channel has no messages
- [ ] Multi-user testing is mandatory — test with 2+ users in separate sessions
- [ ] Error-linked messages (linkedErrorId) display inline error cards when enriched
- [ ] Chrome MCP testing mandatory — verify network, WebSocket, message delivery
- [ ] No request spam — channels fetched once, messages per channel, WebSocket for real-time
- [ ] Zero console errors

**Chat data flow:**

```
User types message → POST /api/v1/chat/channels/{id}/messages
                   → Persisted in PostgreSQL (chat_messages)
                   → ChatBroadcaster broadcasts to WebSocket subscribers
                   → Other connected clients receive message in real-time
                   → UI appends message to query cache
```

**Default channel creation:**
```
User opens /chat → useChannels fetches channels
                 → If empty, calls POST /api/v1/chat/channels/defaults?orgId=...
                 → Creates: general, production, bugs (isDefault=true)
                 → Retries channel list fetch
```

### H) Chat Interaction Completeness Rules

Every visible UI control in Chat must work. No dead buttons, no broken interactions.

- [ ] **Send message**: Backend resolves userId from JWT — frontend only passes content and userName
- [ ] **Members panel**: Opens from header button, shows real org members from `GET /api/v1/chat/members?orgId=`
- [ ] **@ Mention autocomplete**: Typing `@` triggers suggestion popup from real member data, filterable by username
- [ ] **Emoji input**: Emoji button inserts emoji into composer at cursor position
- [ ] **No dead toolbar**: Removed Bold/Italic/Code/Attach buttons that had no backend support
- [ ] **No dead thread panel**: Replaced with functional members panel
- [ ] **All visible controls tested in browser** via Chrome MCP

---

*Document version: 1.7 — Chat Interaction Completeness Rules added.*