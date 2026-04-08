# SeeStack SDK Guidelines

> **Version:** 1.0.0
> **Last Updated:** 2026-03-31
> **Backend Analyzed:** Spring Boot monolith — Java
> **Storage Layer:** ClickHouse (time-series) + PostgreSQL (relational)
> **Async Layer:** Apache Kafka (7 topics, 3 partitions each)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Core SDK Behavior — Mandatory Contract](#3-core-sdk-behavior--mandatory-contract)
4. [Features Mapping](#4-features-mapping)
   - 4.1 [Errors](#41-errors)
   - 4.2 [Logs](#42-logs)
   - 4.3 [HTTP Monitoring](#43-http-monitoring)
   - 4.4 [Session Replay](#44-session-replay)
   - 4.5 [Cron Job Monitoring (Heartbeat)](#45-cron-job-monitoring-heartbeat)
   - 4.6 [Feature Flags](#46-feature-flags)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Data Models (DTOs)](#6-data-models-dtos)
7. [Reliability & Delivery Strategy](#7-reliability--delivery-strategy)
8. [Performance Constraints](#8-performance-constraints)
9. [Security & Privacy](#9-security--privacy)
10. [SDK Design Rules](#10-sdk-design-rules)
11. [Example Flow](#11-example-flow)
12. [SDK Implementation Checklist](#12-sdk-implementation-checklist)

---

## 1. Overview

SeeStack is a full-stack observability and DevOps platform. The SDK is the client-side library that instruments applications to send telemetry data to the SeeStack backend over HTTP.

### What the SDK solves

| Problem | SDK Capability |
|---|---|
| Untracked runtime exceptions | Automatic error capture and grouping |
| No structured application logs | Leveled log ingestion with metadata |
| Blind spots in HTTP traffic | Outbound/inbound HTTP request telemetry |
| No UX visibility | Session replay event streaming |
| Silent cron job failures | Heartbeat/ping-based job monitoring |
| Manual A/B testing infrastructure | Feature flag evaluation |

### Supported Features

- **Error Tracking** — capture exceptions with stack traces, user context, environment metadata
- **Log Ingestion** — structured logs at five severity levels with arbitrary metadata
- **HTTP Request Monitoring** — track inbound and outbound HTTP calls (timing, status, path)
- **Session Replay** — stream DOM/interaction events for later playback
- **Cron Job Monitoring** — heartbeat pings signaling job success or failure
- **Feature Flags** — evaluate remote flags with rollout percentages and targeting rules

### What the SDK does NOT manage

The following are backend-only (management plane) and are **not** SDK concerns:

- Creating/managing monitors (`POST /api/v1/monitors`)
- Creating/managing alert rules (`POST /api/v1/alert-rules`)
- Creating/deleting projects or API keys
- Querying historical data

---

## 2. Authentication

### API Key — Required for All Ingestion

All SDK ingestion requests **must** include the following header:

```
X-SeeStack-Key: <raw-api-key>
```

The backend validates this key by:
1. Computing SHA-256 of the raw key value
2. Looking up the hash in the database
3. Extracting the associated `projectId`
4. Updating `last_used_at` timestamp on success
5. Returning `401 Unauthorized` on failure

The SDK does **not** need to hash the key. Send the raw key as-is.

### Header Requirements

```http
POST /ingest/v1/errors HTTP/1.1
Host: <your-seestack-host>
Content-Type: application/json
X-SeeStack-Key: seestack_live_abc123xyz...
```

### Authentication Scope

| Route Pattern | Auth Method |
|---|---|
| `/ingest/v1/**` | `X-SeeStack-Key` header |
| `/api/v1/**` | OAuth2 Bearer JWT (management — not SDK) |
| `/actuator/health` | None |

### Failure Behavior

If the API key is invalid, the backend returns:

```json
HTTP/1.1 401 Unauthorized

{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "Invalid or missing API key"
  }
}
```

The SDK **must not** retry on `401`. A `401` is a configuration error, not a transient failure. Log a warning to the host application's stderr and disable the SDK for the session.

---

## 3. Core SDK Behavior — Mandatory Contract

Every SDK implementation **must** comply with the following contract, regardless of platform or language.

### 3.1 Network Timeouts

| Parameter | Value |
|---|---|
| Connection timeout | 3 seconds |
| Read/write timeout | 3 seconds |
| Total request timeout | 5 seconds |

Never block indefinitely. If the backend is unreachable, fail fast and buffer locally.

### 3.2 Retry Strategy

Use **truncated exponential backoff** with jitter:

```
attempt 1: immediate
attempt 2: 1s  + random(0–500ms)
attempt 3: 2s  + random(0–500ms)
attempt 4: 4s  + random(0–500ms)
attempt 5: 8s  + random(0–500ms)
→ give up, discard or persist to disk buffer
```

**Retry on:** `5xx`, connection timeout, network error
**Do NOT retry on:** `400`, `401`, `403`, `422` (these are client errors — retrying wastes resources)

### 3.3 In-Memory Buffering

- Maintain a **bounded in-memory ring buffer** per feature (errors, logs, HTTP requests, replay events)
- Default buffer size: **500 items** per feature
- When the buffer is full, **drop the oldest item** (tail-drop) and emit a single internal warning
- Flush the buffer:
  - On a timer (default: every **5 seconds**)
  - When the buffer reaches **80% capacity**
  - On explicit `flush()` call
  - On application shutdown (best-effort drain)

### 3.4 Batch Sending

Where the API supports batching, prefer batch requests over individual calls:

| Feature | Supports Batching | Max Batch Size |
|---|---|---|
| Errors | No — one error per request | 1 |
| Logs | No — one log per request | 1 |
| HTTP Requests | **Yes** | **100 items** |
| Session Replay | **Yes** | Unbounded (backend accepts any count) |
| Cron Heartbeat | No — one ping per request | 1 |

### 3.5 Fail-Safe Behavior

The SDK must **never** cause the host application to crash or throw an unhandled exception. All SDK code must be wrapped in try/catch. Failures must be logged internally (to SDK-level debug output) and swallowed.

```
// Pseudocode — mandatory pattern
try {
  sdk.capture(event)
} catch (anything) {
  sdkLogger.debug("SeeStack SDK: failed to capture event", error)
  // do NOT rethrow
}
```

### 3.6 SDK Initialization

The SDK must be initialized **once** at application startup with at minimum:

```json
{
  "apiKey": "seestack_live_...",
  "host": "https://your-seestack-instance.com"
}
```

Optional initialization parameters:

```json
{
  "apiKey": "...",
  "host": "...",
  "environment": "production",
  "release": "v1.4.2",
  "flushIntervalMs": 5000,
  "bufferSize": 500,
  "debug": false
}
```

After initialization, `projectId` is resolved server-side from the API key. The SDK does not need to know or store the `projectId` — the backend extracts it from the validated key.

---

## 4. Features Mapping

### 4.1 Errors

#### Endpoint

```
POST /ingest/v1/errors
```

#### When to Send

- An unhandled exception is thrown and caught by a global error handler
- The developer explicitly calls `SeeStack.captureError(exception)`
- A caught exception is explicitly reported

#### Payload Structure

```json
{
  "exceptionClass": "string",           // required — e.g. "NullPointerException"
  "message": "string",                  // required — the exception message
  "stackTrace": ["string", "string"],   // optional — array of stack frame strings
  "level": "error",                     // optional — see levels below
  "environment": "production",          // optional — e.g. "staging", "production"
  "release": "v1.4.2",                  // optional — app version/release tag
  "sessionId": "string",                // optional — links to session replay
  "user": {                             // optional — current user context
    "id": "string",
    "email": "string",
    "ip": "string"
  },
  "metadata": {                         // optional — arbitrary key-value context
    "component": "CheckoutForm",
    "orderId": "ORD-9821"
  }
}
```

#### Valid `level` Values

`debug` | `info` | `warn` | `error` | `fatal` | `warning`

#### Response

```json
HTTP/1.1 202 Accepted

{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

#### Grouping / Deduplication

The backend groups errors by **fingerprint**, computed from `exceptionClass` + normalized stack trace. The SDK does not need to compute fingerprints — this is fully server-side.

#### Example — Unhandled Exception Capture

```json
POST /ingest/v1/errors
X-SeeStack-Key: seestack_live_abc123

{
  "exceptionClass": "TypeError",
  "message": "Cannot read properties of undefined (reading 'userId')",
  "stackTrace": [
    "at getUserId (auth.js:42:18)",
    "at validateSession (session.js:17:5)",
    "at Object.<anonymous> (index.js:88:3)"
  ],
  "level": "error",
  "environment": "production",
  "release": "v2.1.0",
  "sessionId": "sess_8f3a2c1b",
  "user": {
    "id": "usr_1234",
    "email": "user@example.com"
  },
  "metadata": {
    "route": "/dashboard",
    "browser": "Chrome 120"
  }
}
```

---

### 4.2 Logs

#### Endpoint

```
POST /ingest/v1/logs
```

#### When to Send

- The developer calls `SeeStack.log(level, message, metadata)`
- The SDK intercepts calls to the platform's native logger (optional integration)
- Automatic breadcrumb capture before an error (recommended pattern)

#### Payload Structure

```json
{
  "level": "info",                      // required — see levels below
  "message": "string",                  // required — the log message
  "service": "string",                  // optional — service/module name
  "traceId": "string",                  // optional — distributed trace ID
  "metadata": {                         // optional — arbitrary key-value pairs
    "key": "value"
  }
}
```

#### Valid `level` Values

`debug` | `info` | `warn` | `error` | `fatal`

> Note: `warning` is valid for errors but **not** for logs. Use `warn` for logs.

#### Response

```json
HTTP/1.1 202 Accepted

{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

#### Batching Behavior

Logs do not have a batch endpoint. Send one log per HTTP request. Buffer in-memory (up to 500) and flush on the timer interval or when the buffer approaches capacity. Do **not** send a log per every line synchronously — always go through the buffer.

#### Example

```json
POST /ingest/v1/logs
X-SeeStack-Key: seestack_live_abc123

{
  "level": "warn",
  "message": "Payment retry attempt 3 of 5",
  "service": "payment-service",
  "traceId": "trace-b9f2a1c3",
  "metadata": {
    "orderId": "ORD-5512",
    "amount": 99.90,
    "currency": "SAR"
  }
}
```

---

### 4.3 HTTP Monitoring

#### Endpoint

```
POST /ingest/v1/http-requests
```

#### When to Send

After every HTTP request completes (both inbound requests **received** by the app and outbound requests **made** by the app). Send in batches — up to 100 per call.

#### Payload Structure

```json
{
  "requests": [
    {
      "traceId": "string",             // required — unique trace/request ID
      "direction": "inbound",          // required — "inbound" or "outbound"
      "method": "GET",                 // required — HTTP verb
      "host": "api.example.com",       // required — target hostname
      "path": "/v1/orders/123",        // required — URL path (no query string)
      "statusCode": 200,               // required — HTTP response status code
      "durationMs": 142,               // required — total round-trip milliseconds, min 0
      "requestSize": 512,              // required — request body size in bytes
      "responseSize": 2048,            // required — response body size in bytes
      "userId": "string",              // optional — user who made the request
      "errorFingerprint": "string",    // optional — link to error if request failed
      "timestamp": "2026-03-31T12:00:00Z"  // required — ISO-8601 UTC timestamp
    }
  ]
}
```

#### `direction` Values

| Value | Meaning |
|---|---|
| `inbound` | A request the application received (server-side SDKs) |
| `outbound` | A request the application made to an external service |

#### Constraints

- `requests` array: **minimum 1, maximum 100** items per call
- `durationMs`: must be `>= 0`
- `timestamp`: must be a valid ISO-8601 datetime string
- `path`: strip query parameters before sending — never log raw query strings (may contain secrets)

#### Response

```json
HTTP/1.1 202 Accepted

{
  "ok": true,
  "accepted": 42
}
```

#### Timing Instrumentation

Wrap the HTTP call with a timer:

```
start = now()
response = http.execute(request)
end = now()

send({
  durationMs: end - start,
  statusCode: response.status,
  requestSize: request.body.length,
  responseSize: response.body.length,
  timestamp: start.toISOString()
})
```

#### Example — Batch of Two Requests

```json
POST /ingest/v1/http-requests
X-SeeStack-Key: seestack_live_abc123

{
  "requests": [
    {
      "traceId": "trace-001",
      "direction": "outbound",
      "method": "POST",
      "host": "payments.stripe.com",
      "path": "/v1/charges",
      "statusCode": 200,
      "durationMs": 320,
      "requestSize": 256,
      "responseSize": 1024,
      "userId": "usr_99",
      "timestamp": "2026-03-31T12:00:00.000Z"
    },
    {
      "traceId": "trace-002",
      "direction": "inbound",
      "method": "GET",
      "host": "api.myapp.com",
      "path": "/api/orders",
      "statusCode": 401,
      "durationMs": 8,
      "requestSize": 0,
      "responseSize": 64,
      "timestamp": "2026-03-31T12:00:01.000Z"
    }
  ]
}
```

---

### 4.4 Session Replay

#### Endpoint

```
POST /ingest/v1/replay
```

#### When to Send

- Continuously as user interaction events occur (DOM mutations, clicks, scrolls, network events, console messages)
- Flush the event buffer every **5 seconds** or when the buffer reaches 50 events
- A `fingerprint` + `sessionId` pair identifies a unique session

#### Payload Structure

```json
{
  "fingerprint": "string",            // required — unique session fingerprint (stable across flush calls)
  "sessionId": "string",              // required — session identifier
  "events": [                         // required — at least 1 event
    {
      "eventType": "string",          // required — type of captured event
      "eventData": "string",          // required — JSON-serialized event payload
      "url": "string",                // optional — page URL when event occurred
      "timestampMillis": 1711886400000  // Unix epoch milliseconds
    }
  ]
}
```

#### `fingerprint` vs `sessionId`

| Field | Purpose |
|---|---|
| `sessionId` | Human-readable session label (e.g., UUID generated at session start) |
| `fingerprint` | Stable unique key used as Kafka partition key for ordering. Use the same fingerprint for all batches within a session. |

Recommended: set `fingerprint = sessionId` unless you have a reason to differentiate.

#### `eventType` Values

The backend does not validate specific eventType strings — use a consistent naming convention across your SDK. Recommended values:

| eventType | Meaning |
|---|---|
| `dom_mutation` | DOM tree change |
| `mouse_click` | User click |
| `mouse_move` | Cursor movement |
| `scroll` | Page scroll |
| `input` | Form field interaction (mask value — see §9) |
| `navigation` | URL/route change |
| `network_request` | XHR/fetch call (mask sensitive headers) |
| `console` | Console.log/warn/error |
| `error` | JavaScript error event |
| `visibility_change` | Tab focus/blur |
| `resize` | Viewport resize |

#### `eventData` Format

`eventData` is a **JSON-serialized string** (not an object). Serialize your event payload to a string before including it.

```json
// eventData value — this is a string, not a nested object:
"eventData": "{\"x\":142,\"y\":320,\"target\":\"button#checkout\"}"
```

#### Privacy and Masking (Mandatory)

The backend has an `InputMaskingService` that masks sensitive data server-side, but the SDK **must also mask client-side** before transmission:

- **Input fields**: Never capture the value of `<input type="password">`, credit card fields, or any element with `data-seestack-mask` attribute
- **Replace** sensitive values with `"[MASKED]"` in `eventData` before sending
- **Network events**: Strip `Authorization`, `Cookie`, `X-SeeStack-Key` headers from captured request metadata
- **URLs**: Strip query parameters from captured URLs if they contain tokens or sensitive data (e.g., `?token=`, `?key=`)

#### Response

```json
HTTP/1.1 202 Accepted

{
  "success": true,
  "data": {
    "eventsReceived": 12
  }
}
```

#### Example

```json
POST /ingest/v1/replay
X-SeeStack-Key: seestack_live_abc123

{
  "fingerprint": "sess_8f3a2c1b",
  "sessionId": "sess_8f3a2c1b",
  "events": [
    {
      "eventType": "navigation",
      "eventData": "{\"from\":\"/home\",\"to\":\"/checkout\",\"method\":\"push\"}",
      "url": "https://myapp.com/checkout",
      "timestampMillis": 1711886400000
    },
    {
      "eventType": "mouse_click",
      "eventData": "{\"x\":512,\"y\":340,\"target\":\"button#place-order\"}",
      "url": "https://myapp.com/checkout",
      "timestampMillis": 1711886405123
    },
    {
      "eventType": "input",
      "eventData": "{\"field\":\"card-number\",\"value\":\"[MASKED]\"}",
      "url": "https://myapp.com/checkout",
      "timestampMillis": 1711886407800
    }
  ]
}
```

---

### 4.5 Cron Job Monitoring (Heartbeat)

#### Endpoint

```
POST /ingest/v1/heartbeat
```

#### When to Send

At the **end** of every cron job or scheduled task execution — regardless of success or failure. The backend uses the `slug` to match the ping to a registered `CronMonitor` entity (created in the management console, not by the SDK).

#### Payload Structure

```json
{
  "slug": "string",         // required — matches the cron monitor slug in the console
  "status": "success",      // required — "success" or "failed"
  "durationMs": 1420,       // required — job execution time in milliseconds
  "message": "string"       // optional — human-readable result message
}
```

#### `slug` Format

- Lowercase alphanumeric characters and hyphens only: `^[a-z0-9\-]+$`
- Must match an existing `CronMonitor` slug created in the management console
- Example: `daily-report-generator`, `payment-reconciliation`

#### `status` Values

| Value | Meaning |
|---|---|
| `success` | Job completed without errors |
| `failed` | Job encountered an error or did not complete |

The backend normalizes status to lowercase — sending `"Success"` or `"FAILED"` is accepted but **lowercase is preferred**.

#### Side Effects

- If `status` is `"failed"`, the backend triggers alert evaluation immediately
- The backend records `durationMs` in ClickHouse for trend analysis

#### Response

```json
HTTP/1.1 202 Accepted

{
  "ok": true,
  "monitorId": "3f2a1b4c-..."
}
```

#### Example — Successful Job

```json
POST /ingest/v1/heartbeat
X-SeeStack-Key: seestack_live_abc123

{
  "slug": "daily-report-generator",
  "status": "success",
  "durationMs": 4320,
  "message": "Processed 1842 records, report emailed to 12 recipients"
}
```

#### Example — Failed Job

```json
POST /ingest/v1/heartbeat
X-SeeStack-Key: seestack_live_abc123

{
  "slug": "payment-reconciliation",
  "status": "failed",
  "durationMs": 180,
  "message": "Database connection refused after 3 retries"
}
```

#### SDK Integration Pattern

```
// Pseudocode — wrap job execution
start = now()
try {
  runJob()
  sendHeartbeat(slug, "success", now() - start, null)
} catch (e) {
  sendHeartbeat(slug, "failed", now() - start, e.message)
  throw e  // rethrow — heartbeat must not swallow job errors
}
```

---

### 4.6 Feature Flags

#### Overview

Feature flags have two integration points for SDKs:

1. **Server-side evaluation** (recommended) — the SDK calls the backend to evaluate flags
2. **All-flags fetch** — the SDK fetches all flags for a project in one call and evaluates locally (for low-latency scenarios)

Both evaluation endpoints are on the **management API** (`/api/v1/`), not the ingestion API. They require an **OAuth2 Bearer token**, not an API key. Feature flag evaluation is **not** a typical SDK use case for client-side SDKs — it is primarily a server-side SDK integration.

> **Note for client-side SDKs**: If you need feature flags in a browser/mobile context, proxy the evaluation through your own backend to avoid exposing management credentials in the client.

#### Evaluate All Flags for a Project

```
GET /api/v1/flags/evaluate?projectId=<uuid>&userId=<string>&attributes=<json>
Authorization: Bearer <jwt>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `projectId` | UUID | Yes | The project to evaluate flags for |
| `userId` | string | No | User identifier for rollout targeting |
| `attributes` | JSON string | No | Arbitrary key-value attributes for rule matching. Default: `{}` |

**Response:**

```json
{
  "success": true,
  "data": {
    "flags": {
      "new-checkout-flow": {
        "enabled": true,
        "value": "variant-b"
      },
      "dark-mode": {
        "enabled": false,
        "value": "false"
      }
    }
  }
}
```

#### Evaluate a Single Flag

```
GET /api/v1/flags/{key}/evaluate?projectId=<uuid>&userId=<string>&attributes=<json>
Authorization: Bearer <jwt>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "key": "new-checkout-flow",
    "enabled": true,
    "value": "variant-b",
    "ruleApplied": "beta-users-rule"
  }
}
```

#### Flag Types

| `type` | `value` format |
|---|---|
| `boolean` | `"true"` or `"false"` (string) |
| `string` | any string value |
| `number` | numeric string, e.g. `"42"` |

All values are returned as strings — the SDK must cast to the appropriate type.

#### Caching Behavior

- Cache flag evaluation results in-memory for **60 seconds** (configurable)
- On cache miss: fetch from backend
- On network failure: return the last cached value (stale-on-error)
- On first call with no cache: return `defaultValue` from flag config

#### Rollout Evaluation (Server-Side)

The backend computes rollout percent server-side using `userId` as the input to a consistent hash. The SDK does not need to implement rollout logic when using the evaluation API.

---

## 5. API Endpoints Reference

All ingestion endpoints are at `/ingest/v1/`. All management endpoints are at `/api/v1/`.

### Ingestion Endpoints (SDK scope — require `X-SeeStack-Key`)

| Method | Path | Description | Max Payload |
|---|---|---|---|
| `POST` | `/ingest/v1/errors` | Ingest a single error/exception | 1 error |
| `POST` | `/ingest/v1/logs` | Ingest a single log entry | 1 log |
| `POST` | `/ingest/v1/http-requests` | Ingest batch of HTTP request telemetry | 100 items |
| `POST` | `/ingest/v1/replay` | Ingest session replay event batch | Unbounded |
| `POST` | `/ingest/v1/heartbeat` | Send cron job heartbeat ping | 1 ping |

### Management Endpoints (not SDK scope — require OAuth2 Bearer JWT)

#### Errors

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/errors` | List error groups |
| `GET` | `/api/v1/errors/{fingerprint}` | Get error group detail |
| `PATCH` | `/api/v1/errors/{fingerprint}/status` | Update error status |

#### Logs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/logs` | Query log entries |

#### HTTP Requests

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/http-requests` | List HTTP requests |
| `GET` | `/api/v1/http-requests/stats` | Aggregate stats |
| `GET` | `/api/v1/http-requests/top-hosts` | Top hosts by request count |
| `GET` | `/api/v1/http-requests/by-trace` | Requests by trace ID |

#### Session Replay

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/replay/{sessionId}` | Fetch replay events for a session |
| `GET` | `/api/v1/errors/{fingerprint}/replay` | Fetch replay events linked to an error |

#### Monitors (HTTP Uptime)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/monitors` | Create HTTP monitor |
| `GET` | `/api/v1/monitors` | List monitors |
| `GET` | `/api/v1/monitors/{monitorId}` | Get monitor |
| `PUT` | `/api/v1/monitors/{monitorId}` | Update monitor |
| `DELETE` | `/api/v1/monitors/{monitorId}` | Delete monitor |
| `GET` | `/api/v1/monitors/{monitorId}/checks` | Get uptime check history |

#### Cron Monitors

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/cron-monitors` | Create cron monitor |
| `GET` | `/api/v1/cron-monitors` | List cron monitors |
| `GET` | `/api/v1/cron-monitors/{id}` | Get cron monitor |
| `PUT` | `/api/v1/cron-monitors/{id}` | Update cron monitor |
| `DELETE` | `/api/v1/cron-monitors/{id}` | Delete cron monitor |
| `GET` | `/api/v1/cron-monitors/{id}/history` | Get heartbeat history |

#### Feature Flags

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/flags` | Create flag |
| `GET` | `/api/v1/flags` | List flags |
| `GET` | `/api/v1/flags/{key}` | Get flag |
| `PUT` | `/api/v1/flags/{key}` | Update flag |
| `DELETE` | `/api/v1/flags/{key}` | Delete flag |
| `PATCH` | `/api/v1/flags/{key}/toggle` | Toggle flag enabled state |
| `GET` | `/api/v1/flags/evaluate` | Evaluate all flags |
| `GET` | `/api/v1/flags/{key}/evaluate` | Evaluate single flag |
| `GET` | `/api/v1/flags/{key}/exposures/summary` | Exposure analytics |
| `GET` | `/api/v1/flags/{key}/exposures` | Exposure log |
| `GET` | `/api/v1/flags/{key}/audit` | Audit log |

#### Alerts

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/alert-rules` | Create alert rule |
| `GET` | `/api/v1/alert-rules` | List alert rules |
| `GET` | `/api/v1/alert-rules/{id}` | Get alert rule |
| `PATCH` | `/api/v1/alert-rules/{id}` | Update alert rule |
| `DELETE` | `/api/v1/alert-rules/{id}` | Delete alert rule |
| `PATCH` | `/api/v1/alert-rules/{id}/toggle` | Toggle alert rule |
| `GET` | `/api/v1/notification-log` | List notification history |

#### Projects & API Keys

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/projects` | Create project |
| `GET` | `/api/v1/projects` | List projects |
| `GET` | `/api/v1/projects/{projectId}` | Get project |
| `PUT` | `/api/v1/projects/{projectId}` | Update project |
| `DELETE` | `/api/v1/projects/{projectId}` | Delete project |
| `POST` | `/api/v1/projects/{projectId}/api-keys` | Create API key |
| `GET` | `/api/v1/projects/{projectId}/api-keys` | List API keys |
| `PUT` | `/api/v1/projects/{projectId}/api-keys/{keyId}` | Rename API key |
| `DELETE` | `/api/v1/projects/{projectId}/api-keys/{keyId}` | Delete API key |

---

## 6. Data Models (DTOs)

All field types use JSON type names. Fields marked **required** will cause a `400 Bad Request` if missing or blank.

### 6.1 Error Ingest DTO

**`POST /ingest/v1/errors` — Request Body**

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `exceptionClass` | string | **Yes** | Non-blank | Class/type of the exception, e.g. `TypeError` |
| `message` | string | **Yes** | Non-blank | Exception message |
| `stackTrace` | string[] | No | — | Each element is one stack frame line |
| `level` | string | No | `debug\|info\|warn\|error\|fatal\|warning` | Default: `error` |
| `environment` | string | No | — | e.g. `production`, `staging` |
| `release` | string | No | — | App version, e.g. `v1.4.2` |
| `sessionId` | string | No | — | Links event to a session replay |
| `user.id` | string | No | — | Internal user ID |
| `user.email` | string | No | — | User email address |
| `user.ip` | string | No | — | User IP address |
| `metadata` | object | No | — | Arbitrary key-value map |

### 6.2 Log Ingest DTO

**`POST /ingest/v1/logs` — Request Body**

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `level` | string | **Yes** | `debug\|info\|warn\|error\|fatal` | Case-sensitive |
| `message` | string | **Yes** | Non-blank | Log message text |
| `service` | string | No | — | Service or module name |
| `traceId` | string | No | — | Distributed trace correlation ID |
| `metadata` | object | No | — | Arbitrary key-value map |

### 6.3 Replay Ingest DTO

**`POST /ingest/v1/replay` — Request Body**

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `fingerprint` | string | **Yes** | Non-blank | Unique session fingerprint; used as Kafka partition key |
| `sessionId` | string | **Yes** | Non-blank | Session identifier |
| `events` | ReplayEvent[] | **Yes** | Non-empty | At least 1 event required |
| `events[].eventType` | string | **Yes** | Non-blank | Event category label |
| `events[].eventData` | string | **Yes** | Non-blank | JSON-serialized string of event payload |
| `events[].url` | string | No | — | Page URL when event fired |
| `events[].timestampMillis` | number | No | — | Unix epoch milliseconds |

### 6.4 HTTP Request Ingest DTO

**`POST /ingest/v1/http-requests` — Request Body**

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `requests` | HttpRequestItem[] | **Yes** | 1–100 items | Batch array |
| `requests[].traceId` | string | **Yes** | Non-blank | Unique trace/request ID |
| `requests[].direction` | string | **Yes** | Non-blank | `inbound` or `outbound` |
| `requests[].method` | string | **Yes** | Non-blank | HTTP verb: `GET`, `POST`, etc. |
| `requests[].host` | string | **Yes** | Non-blank | Target hostname, no protocol |
| `requests[].path` | string | **Yes** | Non-blank | URL path only, no query string |
| `requests[].statusCode` | integer | **Yes** | — | HTTP response status code |
| `requests[].durationMs` | integer | **Yes** | `>= 0` | Total round-trip duration |
| `requests[].requestSize` | integer | **Yes** | — | Request body size in bytes |
| `requests[].responseSize` | integer | **Yes** | — | Response body size in bytes |
| `requests[].userId` | string | No | — | Authenticated user ID |
| `requests[].errorFingerprint` | string | No | — | Error group fingerprint if request failed |
| `requests[].timestamp` | string | **Yes** | Non-blank | ISO-8601 UTC datetime |

### 6.5 Cron Heartbeat DTO

**`POST /ingest/v1/heartbeat` — Request Body**

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `slug` | string | **Yes** | Non-blank | Must match existing CronMonitor slug |
| `status` | string | **Yes** | Non-blank | `success` or `failed` (case-insensitive) |
| `durationMs` | number | **Yes** | — | Job execution duration in milliseconds |
| `message` | string | No | — | Optional human-readable result message |

### 6.6 Feature Flag Evaluation Response

**`GET /api/v1/flags/evaluate` — Response `data.flags`**

Each flag key maps to:

| Field | Type | Notes |
|---|---|---|
| `enabled` | boolean | Whether this flag is active for the evaluated context |
| `value` | string | String representation of the flag value |

**`GET /api/v1/flags/{key}/evaluate` — Response `data`**

| Field | Type | Notes |
|---|---|---|
| `key` | string | The flag key |
| `enabled` | boolean | Whether active |
| `value` | string | String representation of value |
| `ruleApplied` | string | Which targeting rule matched (if any) |

### 6.7 Standard API Response Envelope

All endpoints return responses in this wrapper:

**Success:**
```json
{
  "success": true,
  "data": { /* payload */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

**Paginated:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 100
    }
  }
}
```

---

## 7. Reliability & Delivery Strategy

### 7.1 Retry Strategy

```
Retryable:        5xx, connection timeout, network unreachable
Non-retryable:    400 Bad Request, 401 Unauthorized, 403 Forbidden, 422 Unprocessable Entity

Backoff schedule:
  Attempt 1: immediate
  Attempt 2: 1s  ± jitter(0–500ms)
  Attempt 3: 2s  ± jitter(0–500ms)
  Attempt 4: 4s  ± jitter(0–500ms)
  Attempt 5: 8s  ± jitter(0–500ms)
  → discard event after 5 failed attempts
```

Jitter is mandatory to prevent thundering herd if many SDK instances restart simultaneously.

### 7.2 Buffering Strategy

```
Buffer type:   Ring buffer (bounded FIFO)
Buffer size:   500 items per feature (errors, logs, HTTP requests, replay events)
Eviction:      Oldest item dropped when buffer is full (tail-drop)
Flush trigger: Every 5 seconds OR at 80% capacity OR on explicit flush() call
Shutdown:      Best-effort drain — attempt to flush all buffered items with a 5-second deadline
```

### 7.3 Deduplication

- **Errors**: Deduplication is server-side only, by fingerprint. The SDK does not deduplicate. If the same error fires 100 times, send all 100 — the backend increments `occurrenceCount`.
- **Logs / HTTP requests / Replay events**: No deduplication — all events are stored individually.
- **Heartbeats**: Each ping is a new record. No deduplication needed.

### 7.4 Ordering Guarantees

The backend uses Kafka partition keys:

| Feature | Partition Key | Ordering Guarantee |
|---|---|---|
| Errors | `fingerprint` | All occurrences of same error are ordered |
| Logs | `projectId` | Per-project ordering |
| Replay | `fingerprint` | All events in same session are ordered |
| HTTP Requests | `projectId` | Per-project ordering |
| Heartbeats | `monitorId` | Per-monitor ordering |

The SDK must ensure that replay events within a single flush batch are **sorted by `timestampMillis` ascending** before sending.

### 7.5 Failure Handling Decision Tree

```
Send attempt fails
  ├─ 401 Unauthorized
  │     → Log warning: "SeeStack SDK: invalid API key — disabling SDK"
  │     → Disable all SDK operations for session
  │     → Do NOT retry
  │
  ├─ 400 Bad Request
  │     → Log debug: "SeeStack SDK: malformed payload — dropping event"
  │     → Discard event
  │     → Do NOT retry
  │
  ├─ 429 Too Many Requests
  │     → Respect Retry-After header if present
  │     → Apply backoff and retry up to 3 more attempts
  │
  ├─ 5xx Server Error
  │     → Apply exponential backoff
  │     → Retry up to 5 attempts
  │     → Discard after 5 failures
  │
  └─ Network timeout / connection refused
        → Apply exponential backoff
        → Retry up to 5 attempts
        → Discard after 5 failures
```

---

## 8. Performance Constraints

### 8.1 Payload Size Limits

| Feature | Hard Limit | Recommendation |
|---|---|---|
| HTTP Request batch | **100 items** per request | Flush at 50 items or every 5s |
| Replay event batch | No enforced limit | Keep batches under 200 events (~500KB) |
| Log entry | No explicit limit | Keep `message` under 10KB, `metadata` under 50 fields |
| Error stackTrace | No explicit limit | Trim to 50 frames if deeper |
| Heartbeat message | No explicit limit | Keep under 1KB |

### 8.2 Flush Frequency

| Feature | Recommended Flush Interval | Trigger |
|---|---|---|
| Errors | Immediate (no delay) | Errors are urgent — flush immediately |
| Logs | Every 5 seconds | Timer-based |
| HTTP Requests | Every 5 seconds or at 50 items | Timer or count |
| Replay Events | Every 5 seconds or at 50 events | Timer or count |
| Heartbeat | Immediate after job completes | Event-driven |

### 8.3 Concurrency

- Use a single background worker/thread per feature to manage flushing
- Never spawn a new thread per event
- HTTP calls to the backend must be non-blocking / async relative to the application thread

### 8.4 SDK Memory Footprint

- Total in-memory buffer: ~500 items × 5 features = 2,500 items max
- Estimate ~1–5 KB per item
- Target: SDK uses less than **15 MB** of heap under normal conditions

---

## 9. Security & Privacy

### 9.1 What Must Never Be Captured

The SDK must actively prevent the following from reaching the backend:

| Category | Examples |
|---|---|
| Passwords | `<input type="password">` values |
| Payment card data | Card number, CVV, expiry |
| Authentication tokens | JWT, session tokens, OAuth codes |
| API secrets | Any key/secret in request headers or bodies |
| PII in query strings | Email, phone, SSN in URL parameters |

### 9.2 Mandatory Masking Rules

**Session Replay:**
- Mask any `<input type="password">` → capture element reference, replace value with `"[MASKED]"`
- Mask any element with `data-seestack-mask` attribute
- Mask any element with CSS class `seestack-mask`
- Do not capture clipboard events (paste operations may contain sensitive data)

**HTTP Request Monitoring:**
- Strip the following request headers before logging: `Authorization`, `Cookie`, `X-SeeStack-Key`, `X-API-Key`, `X-Auth-Token`
- Strip query parameters matching patterns: `token`, `key`, `secret`, `password`, `auth`, `api_key`
- Replace stripped values with `"[FILTERED]"`

**Error Tracking:**
- Never include full database connection strings in error metadata
- Sanitize error messages that may contain SQL (strip parameter values)

**Logs:**
- If the developer logs an object containing `password`, `secret`, `token`, `key`, or `authorization` fields, mask those values in `metadata` before sending

### 9.3 Network Security

- All requests must use **HTTPS**. The SDK must refuse to send data over HTTP in production environments.
- The SDK must validate TLS certificates. Certificate pinning is optional.
- Never log the raw API key to any console or log file.

---

## 10. SDK Design Rules

These rules are non-negotiable for all SDK implementations across all languages and platforms.

| # | Rule |
|---|---|
| 1 | **Never block the main thread.** All network calls must be async or on a background thread. |
| 2 | **Fail silently.** Never throw an unhandled exception from within the SDK. |
| 3 | **Never crash the host app.** Wrap all SDK code in try/catch. Swallow errors internally. |
| 4 | **Be lightweight.** Minimal dependencies. No heavy serialization libraries unless necessary. |
| 5 | **Respect initialization.** If `init()` has not been called, all SDK methods must be no-ops. |
| 6 | **Single initialization.** Calling `init()` more than once should be idempotent or emit a warning and ignore subsequent calls. |
| 7 | **No global state pollution.** Do not patch global error handlers without explicit opt-in by the developer. |
| 8 | **Respect privacy.** Apply masking rules before any data leaves the device. |
| 9 | **Flush on shutdown.** On process exit / app termination, attempt to drain the buffer within 5 seconds. |
| 10 | **Provide debug mode.** When `debug: true` is set, log all outgoing payloads and responses to the SDK's internal logger (not the host app's logger). |
| 11 | **Never exceed timeouts.** Respect the 3-second connection / read timeout strictly. |
| 12 | **Provide a manual flush API.** Expose a `flush()` method developers can call (e.g., before testing or shutdown). |

### 10.1 Recommended Public API Surface

```
// Minimum required API
SeeStack.init(config)
SeeStack.captureError(exception, context?)
SeeStack.captureLog(level, message, metadata?)
SeeStack.flush() → Promise<void>
SeeStack.setUser(user)        // sets default user context for subsequent events
SeeStack.clearUser()          // clears user context

// HTTP monitoring (automatic instrumentation)
SeeStack.instrumentHttp()     // patches fetch/XMLHttpRequest/http.request

// Session replay (browser SDK only)
SeeStack.startReplay(sessionId, fingerprint?)
SeeStack.stopReplay()

// Cron monitoring
SeeStack.startJob(slug) → JobHandle
SeeStack.finishJob(handle, status, message?)

// Feature flags (server-side SDK only)
SeeStack.getFlag(key, userId?, attributes?) → FlagResult
SeeStack.getAllFlags(userId?, attributes?) → FlagsMap
```

---

## 11. Example Flow

### Full Flow: App → SDK → API → Backend → Storage

```
Application Code
     │
     │  SeeStack.captureError(err)
     ▼
SDK (in-process)
     │  1. Wrap in try/catch
     │  2. Serialize to ErrorIngestRequest DTO
     │  3. Apply privacy masking
     │  4. Push to in-memory error buffer
     │
     │  [background flush timer fires]
     │
     │  5. Dequeue item from buffer
     │  6. Build HTTP request:
     │       POST /ingest/v1/errors
     │       X-SeeStack-Key: seestack_live_abc123
     │       Content-Type: application/json
     │       Timeout: 3s
     ▼
SeeStack Backend (Spring Boot)
     │
     │  7. ApiKeyAuthFilter:
     │       SHA-256(raw key) → lookup in DB
     │       Extract projectId from key record
     │       Set request attribute: seestack.projectId
     │
     │  8. ErrorIngestController:
     │       Validate request body (Jakarta validation)
     │       Compute error fingerprint (exceptionClass + stack)
     │       Build ErrorKafkaEvent
     │       Publish to Kafka topic: seestack.errors
     │       Partition key: fingerprint
     │       Return 202 Accepted
     │
     ▼
Apache Kafka
     │  Topic: seestack.errors (3 partitions)
     │  Retained for configured retention period
     ▼
Kafka Consumer (ErrorKafkaConsumer)
     │  Consumes ErrorKafkaEvent
     │  Upserts ErrorGroup in PostgreSQL (by fingerprint)
     │  Increments occurrenceCount
     │  Updates lastOccurrenceAt
     │  Writes full event to ClickHouse
     ▼
Storage
  ├─ PostgreSQL: error_groups table (aggregated view — count, status, timestamps)
  └─ ClickHouse: error_events table (full event log — all occurrences)
```

### Real Payload Example — End-to-End

**Step 1: Application catches an exception**

```javascript
try {
  const user = await getUser(userId)
  processOrder(user)
} catch (e) {
  SeeStack.captureError(e, {
    environment: 'production',
    release: 'v2.3.1',
    user: { id: currentUser.id, email: currentUser.email }
  })
}
```

**Step 2: SDK serializes and sends**

```http
POST /ingest/v1/errors HTTP/1.1
Host: seestack.mycompany.com
X-SeeStack-Key: seestack_live_kG9qR2mNpX7vL4wT
Content-Type: application/json
Connection: keep-alive

{
  "exceptionClass": "DatabaseConnectionError",
  "message": "ECONNREFUSED: Connection to postgres:5432 refused",
  "stackTrace": [
    "at PgClient.connect (pg/lib/client.js:54:17)",
    "at getUser (src/db/users.js:23:5)",
    "at processRequest (src/handlers/order.js:88:12)"
  ],
  "level": "error",
  "environment": "production",
  "release": "v2.3.1",
  "user": {
    "id": "usr_9921",
    "email": "customer@example.com"
  },
  "metadata": {
    "region": "me-south-1",
    "instanceId": "i-0ab1c2d3e4f5"
  }
}
```

**Step 3: Backend returns**

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "3a7f2c1b-4d8e-9012-abcd-ef1234567890"
  }
}
```

**Step 4: Event flows through Kafka → ClickHouse + PostgreSQL**

The error is now queryable at `GET /api/v1/errors?projectId=...` and visible in the SeeStack dashboard. If an alert rule exists for this project matching the error severity, a notification is dispatched via configured channels (email, Slack, Discord, webhook).

---

## 12. SDK Implementation Checklist

Use this checklist when building a new SDK. Every item is derived from actual backend behavior.

### Initialization

- [ ] SDK accepts `apiKey` and `host` as required init config
- [ ] SDK accepts optional `environment`, `release`, `flushIntervalMs`, `bufferSize`, `debug`
- [ ] `init()` is idempotent — calling twice emits a warning and ignores the second call
- [ ] All SDK methods are no-ops if `init()` has not been called
- [ ] SDK validates that `apiKey` is non-empty at init time (fail fast, do not wait for first request)

### Authentication

- [ ] All ingestion requests include `X-SeeStack-Key: <raw key>` header
- [ ] `Content-Type: application/json` is set on all POST requests
- [ ] On `401` response: disable SDK, emit warning, do NOT retry
- [ ] API key is never logged to console in non-debug mode

### Error Capture

- [ ] `captureError(exception, context?)` is implemented
- [ ] `exceptionClass` is extracted from exception type/name
- [ ] `message` is extracted from exception message
- [ ] Stack trace is extracted as an array of strings (one frame per element)
- [ ] `level` defaults to `"error"` when not specified
- [ ] `sessionId` is attached if a session replay session is active
- [ ] User context is attached if `setUser()` has been called
- [ ] `environment` and `release` from init config are included
- [ ] Error is sent to `POST /ingest/v1/errors`
- [ ] Error is not buffered — send immediately (errors are urgent)

### Log Capture

- [ ] `captureLog(level, message, metadata?)` is implemented
- [ ] Valid levels enforced: `debug`, `info`, `warn`, `error`, `fatal`
- [ ] Logs are buffered and flushed every 5 seconds
- [ ] Logs are sent to `POST /ingest/v1/logs` (one per request)
- [ ] `service` and `traceId` can be set per log or from a global context

### HTTP Monitoring

- [ ] Auto-instrumentation patches the platform's native HTTP client (opt-in)
- [ ] `traceId` is generated per request (UUID or span ID)
- [ ] `direction` is correctly set: `inbound` for received, `outbound` for made
- [ ] `durationMs` is measured accurately (start time before request, end time after response)
- [ ] `requestSize` and `responseSize` are measured in bytes
- [ ] `path` has query parameters stripped
- [ ] `Authorization`, `Cookie`, `X-SeeStack-Key` headers are NOT forwarded in metadata
- [ ] Requests are batched up to 100 and sent to `POST /ingest/v1/http-requests`
- [ ] `timestamp` is ISO-8601 UTC format (not local time)

### Session Replay

- [ ] `startReplay(sessionId, fingerprint?)` generates a stable fingerprint
- [ ] Same `fingerprint` is used across all batches in one session
- [ ] `eventData` is serialized as a **JSON string** (not an object)
- [ ] Events are sorted by `timestampMillis` ascending within each batch
- [ ] `<input type="password">` values are replaced with `"[MASKED]"` before sending
- [ ] Elements with `data-seestack-mask` attribute are masked
- [ ] Replay events are sent to `POST /ingest/v1/replay`
- [ ] Batch flushed every 5 seconds or at 50 events

### Cron Job Monitoring

- [ ] `startJob(slug)` records start time and returns a job handle
- [ ] `finishJob(handle, 'success'|'failed', message?)` computes `durationMs`
- [ ] Heartbeat is sent to `POST /ingest/v1/heartbeat` immediately after job completes
- [ ] `slug` format validated: `^[a-z0-9\-]+$`
- [ ] `status` is normalized to lowercase before sending
- [ ] Job errors are rethrown after heartbeat is sent (SDK must not swallow job errors)

### Feature Flags

- [ ] Flag evaluation calls `GET /api/v1/flags/evaluate` with `projectId`, `userId`, `attributes`
- [ ] Results are cached in-memory for 60 seconds
- [ ] On cache miss: fetch from backend
- [ ] On network error: return last cached value (stale-on-error)
- [ ] All flag values are returned as strings — SDK casts to appropriate type
- [ ] `getAllFlags()` fetches all flags in one call

### Reliability

- [ ] Exponential backoff implemented: 1s, 2s, 4s, 8s (5 attempts max)
- [ ] Jitter added to backoff delays (0–500ms random)
- [ ] `400`, `401`, `403`, `422` responses are NOT retried
- [ ] `5xx` and network errors are retried with backoff
- [ ] In-memory ring buffer: 500 items per feature, oldest dropped when full
- [ ] Buffer flushed on application shutdown (5-second drain deadline)
- [ ] `flush()` method exposed publicly

### Performance

- [ ] All network calls are async / non-blocking
- [ ] Single background flush worker per feature (not one thread per event)
- [ ] HTTP Request batch flushed at 50 items or every 5 seconds (whichever first)
- [ ] SDK heap usage stays under 15 MB under normal load

### Privacy & Security

- [ ] All requests use HTTPS; HTTP refused in production
- [ ] TLS certificates are validated
- [ ] Password fields masked in session replay
- [ ] Sensitive headers filtered from HTTP monitoring
- [ ] API key never written to logs in non-debug mode
- [ ] Query parameters containing `token`, `key`, `secret`, `password` are stripped from HTTP request paths

### Testing

- [ ] Unit tests cover all DTO serialization edge cases
- [ ] Unit tests cover exponential backoff and jitter logic
- [ ] Unit tests verify masking rules (password fields, sensitive headers)
- [ ] Integration test sends real payloads to staging backend and asserts `202`
- [ ] Test for SDK no-op behavior before `init()` is called
- [ ] Test for `401` disabling the SDK
- [ ] Test for buffer eviction (oldest item dropped at capacity)
- [ ] Test for graceful shutdown drain

---

*This document was generated from direct analysis of the SeeStack backend source code. All endpoint paths, field names, enum values, and validation rules are derived from actual implementation, not inferred from convention.*
