# SeeStack

> A unified observability and team collaboration platform for startups and small teams.
> Replaces Sentry + Datadog + UptimeRobot + Slack with a single product.

## What is SeeStack?

SeeStack is the **single home base** for engineering teams:
- **Error Monitoring** — Full stack traces, grouping, status management
- **Logs** — Multi-level log ingestion with live tail
- **Website Monitor** — HTTP/HTTPS uptime monitoring with alerting
- **SSH Manager** — Browser-based terminal with audit logging
- **Built-in Chat** — Slack replacement with error linking

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4, Java 25 |
| Auth | Keycloak 25 |
| Transactional DB | PostgreSQL 16 |
| Time-series DB | ClickHouse 24 |
| Messaging | Apache Kafka (KRaft) |
| Cache | Redis 7 |
| Frontend | React + Vite |
| Mobile | React Native |

## Project Structure

```
seestack/
├── backend/          ← Spring Boot 4 monolith
├── packages/
│   ├── shared/       ← Shared API client + types
│   ├── web/          ← React + Vite
│   └── mobile/       ← React Native
├── infra/
│   ├── docker/       ← Docker Compose files
│   └── nginx/        ← Reverse proxy config
├── progress/         ← Development progress tracking
└── .github/
    └── workflows/    ← CI/CD pipelines
```

## Getting Started

### Prerequisites
- Java 25
- Docker + Docker Compose
- Node 20+ with pnpm

### Run locally

```bash
# Start all infrastructure
docker compose -f infra/docker/docker-compose.yml up -d

# Start backend
cd backend
./gradlew bootRun

# Start frontend
cd packages/web
pnpm dev
```

### Environment

Copy `.env.example` to `.env` and fill in values before running.

## Development

See `progress/README.md` for current development status.
See `SEESTACK_SPEC.md` for full project specification.
