# seeStack — Prerequisites

Exact tools required to build and run the project. Versions listed
are the ones the project was developed and tested against.

## Host tools

| Tool             | Version                                | Notes                                      |
| ---------------- | -------------------------------------- | ------------------------------------------ |
| Docker Engine    | 24+ (tested with 29.1.4)               | Required for the infra containers.         |
| Docker Compose   | v2 plugin (bundled with Docker Desktop)| Used via `docker compose …`.               |
| Java JDK         | 17 (project toolchain) — 25 also works | Needed to build & run the Spring Boot jar. |
| Gradle           | 9.x (tested with 9.4.1)                | Build system for the backend.              |
| Node.js          | 20 LTS or newer                        | Runs Vite dev server and the JS SDK.       |
| pnpm             | 9+                                     | Frontend package manager (workspace mode). |
| Python (optional)| 3.10+                                  | Only needed to run the Python SDK demo.    |

All other dependencies (PostgreSQL, ClickHouse, Kafka, Redis) run as
Docker containers — no host installs are required.

## Infrastructure containers

Pulled automatically by `docker compose up`:

| Service    | Image                                   | Host port used                |
| ---------- | --------------------------------------- | ----------------------------- |
| PostgreSQL | `postgres:16-alpine`                    | **5433** (remapped from 5432) |
| ClickHouse | `clickhouse/clickhouse-server:24-alpine`| **18123** HTTP, **19000** TCP |
| Kafka      | `apache/kafka:3.8.0` (KRaft mode)       | **19092**                     |
| Redis      | `redis:7-alpine`                        | **16379**                     |

The backend itself listens on **8082**; the Vite frontend on **3000**.

## Environment variables

The backend reads the following at startup (sensible dev defaults are
in `backend/src/main/resources/application.properties`):

| Variable                   | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `POSTGRES_HOST` / `_PORT`  | PostgreSQL connection (`localhost` / `5433`)  |
| `POSTGRES_DB` / `_USER`    | `seestack` / `seestack`                       |
| `POSTGRES_PASSWORD`        | Required — any strong string in dev           |
| `REDIS_HOST` / `_PORT`     | Redis connection (`localhost` / `16379`)      |
| `REDIS_PASSWORD`           | `devredis` in the sample `.env`               |
| `CLICKHOUSE_HOST` / `_PORT`| ClickHouse HTTP (`localhost` / `18123`)       |
| `CLICKHOUSE_DB` / `_USER`  | `seestack` / `default`                        |
| `KAFKA_BOOTSTRAP_SERVERS`  | `localhost:19092`                             |
| `SEESTACK_JWT_SECRET`      | Required — any 32+ char string in dev         |

## No external services required

The project does not talk to Keycloak, OAuth providers, payment
gateways, or any third-party identity or billing service. Everything
the backend needs is provided by the four infra containers above.
