# seeStack — One-Page Summary

**What it is.** A focused developer monitoring platform. seeStack
captures runtime errors from applications and continuously monitors
the availability of websites, presenting both in one dashboard.

## Core features

- **Error Monitoring** — applications send exceptions via a
  zero-dependency SDK to a project-scoped ingest endpoint. Repeated
  events collapse into a single grouped issue through a stable
  SHA-256 fingerprint over the exception class and top call-site
  frames.
- **Website Monitoring** — users register URLs with a check interval.
  A background scheduler performs HTTP checks, classifies each
  result as *up* or *down* (`2xx/3xx` response within 30 s), and
  records full history.
- **Projects Management** — every user owns one or more projects.
  Creating a project issues a one-time ingest key that the SDK uses
  for authentication.
- **SDK Integration** — first-party, single-file SDKs for
  JavaScript, Java, and Python. The dashboard includes a **SDK
  Setup** page that renders install, initialisation, and capture
  snippets pre-filled with the selected project’s ingest key.
- **Authentication** — email and password registration with
  BCrypt-hashed credentials; requests to the dashboard carry an
  HS256 JSON Web Token issued by the backend.
- **Basic Port Exposure Check** — a small, self-contained security
  scan implemented in pure Java (`java.net.Socket`). Given a
  hostname, the backend resolves the host and attempts a TCP
  connect against a fixed, short list of common ports (22, 80,
  443, 3306, 5432, 6379, 8080, 8443) with a 1.5 s timeout. Results
  (open vs. closed) are stored in PostgreSQL and surfaced on the
  dashboard. Explicitly *not* a penetration test or vulnerability
  scanner; no external tools (nmap, masscan, etc.) are used.
- **Error Insights** — the error detail page renders a compact,
  explainable Insights card: impact level (LOW / MEDIUM / HIGH),
  total occurrences, "Active recently" / "No recent activity"
  label, first/last seen, detected patterns (e.g. same top stack
  frame, same endpoint), and a hourly timeline for the last 24 h.
  No speculative rate or per-minute / per-hour metrics — every
  value is a direct function of stored data.
- **AI-assisted error explanation** — on the error detail page,
  the user can ask OpenAI to explain what happened, the likely
  cause, a suggested fix, and prevention tips. Secrets are
  stripped before data leaves the backend, and the feature is
  gracefully disabled when `OPENAI_API_KEY` is not set.

## Dashboard

Six sections, plus login and register:
**Overview · Projects · Errors · Monitors · Security Scan · SDK Setup**.

## Architecture

- **Backend** — Spring Boot 3 on Java 17.
- **Frontend** — React, Vite, TypeScript.
- **Relational storage** — PostgreSQL 16 (users, projects, API keys,
  monitor configs, grouped error issues).
- **Time-series storage** — ClickHouse 24 (raw error events, monitor
  check history).
- **Messaging** — Apache Kafka (KRaft mode) buffers ingest so the
  API returns immediately.
- **Cache** — Redis.
- **Runtime** — Docker Compose brings the full stack up with one
  command.

## Workflow

- **Errors:** SDK → `POST /ingest/v1/errors` (X-SeeStack-Key) →
  Kafka → ClickHouse (raw events) + PostgreSQL (grouped issues) →
  dashboard `/errors` and `/errors/:fingerprint`.
- **Monitors:** `POST /api/v1/monitors` (Bearer JWT) → scheduler
  performs HTTP GET every minute → Kafka → ClickHouse → dashboard
  `/monitors`.

## Team Responsibilities

Hi Dr., I hope you are doing well.

The responsibilities were distributed as follows:

- **Abdualziz Alosaimi & Salem Omran** — Backend development and
  system architecture.
- **Mohammed Taleb & Mohammed bin Eid** — Frontend development and
  dashboard implementation.
- **Omar Alallaf & Faisal Alghanim** — Testing and documentation.

## Validation

The system was exercised end-to-end. Sample results:

- Backend `/actuator/health` returned UP; schema applied
  automatically.
- Register and login returned signed JWTs; project creation returned
  a one-time ingest key.
- SDK events in three languages (JavaScript, Java, Python) were
  accepted with HTTP 202 and appeared as grouped issues in the
  dashboard.
- The monitor scheduler recorded UP and DOWN classifications for a
  healthy URL and an unreachable URL; the dashboard rendered both
  with correct status, response time, and uptime percentage.
- The dashboard rendered the six intended sections with seeded
  data immediately after login.
- A Basic Port Exposure Check against `example.com` completed in
  roughly one second and displayed the expected open (80, 443)
  and closed ports.
- With `OPENAI_API_KEY` set, the error detail page successfully
  returned an AI-generated explanation and suggested fix; without
  the key, the page showed a clean "AI analysis is not configured"
  message and issued no outbound request.
