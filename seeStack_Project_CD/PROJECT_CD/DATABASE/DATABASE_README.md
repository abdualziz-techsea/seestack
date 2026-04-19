# seeStack — Database

seeStack uses two stores with different shapes:

- **PostgreSQL 16** for small, relational metadata that needs
  transactional updates (users, projects, API keys, monitor configs,
  and the grouped-error summary rows).
- **ClickHouse 24** for time-series ingest — the raw error events
  and the uptime check history.

Both schemas are idempotent and are applied automatically on first
backend boot:

- `schema.sql` → the single consolidated Flyway migration, applied
  by the backend's Flyway bootstrap.
- `clickhouse_schema.sql` → executed by the backend's
  `ClickHouseSchemaInitializer` bean at startup.

## PostgreSQL tables

All six tables are created by `schema.sql`. The relationships are:

```
users ──owns──▶ projects ─┬─owns──▶ api_keys
                          ├─owns──▶ monitor_configs
                          └─owns──▶ error_groups
```

### `users`
Internal account table for email + password auth.

| Column          | Type          | Notes                           |
| --------------- | ------------- | ------------------------------- |
| `id`            | UUID PK       |                                 |
| `email`         | VARCHAR unique| Normalised to lowercase on write|
| `password_hash` | VARCHAR       | BCrypt hash                     |
| `name`          | VARCHAR       | Optional display name           |
| `created_at`    | TIMESTAMPTZ   |                                 |

### `projects`
A user owns one or more projects. Errors and monitors live under a
project.

| Column       | Type          | Notes                               |
| ------------ | ------------- | ----------------------------------- |
| `id`         | UUID PK       |                                     |
| `user_id`    | UUID FK users | `ON DELETE CASCADE`                 |
| `name`       | VARCHAR       |                                     |
| `slug`       | VARCHAR(100)  | Unique per user                     |
| `platform`   | VARCHAR(100)  | Free-form tag ("node", "web", …)    |
| `created_at` | TIMESTAMPTZ   |                                     |

### `api_keys`
Ingest keys used by SDKs. Only the SHA-256 hash is stored — the raw
key is shown to the user once at creation.

| Column         | Type           | Notes                           |
| -------------- | -------------- | ------------------------------- |
| `id`           | UUID PK        |                                 |
| `project_id`   | UUID FK projects | `ON DELETE CASCADE`           |
| `key_hash`     | VARCHAR unique | `SHA-256(raw key)`              |
| `key_prefix`   | VARCHAR(20)    | Safe preview (`ask_live_`)      |
| `name`         | VARCHAR        | Default: `Default`              |
| `last_used_at` | TIMESTAMPTZ    | Updated on every ingest call    |
| `created_at`   | TIMESTAMPTZ    |                                 |

### `monitor_configs`
One row per URL being watched.

| Column             | Type    | Notes                                 |
| ------------------ | ------- | ------------------------------------- |
| `id`               | UUID PK |                                       |
| `project_id`       | UUID FK |                                       |
| `name`             | VARCHAR |                                       |
| `url`              | TEXT    | HTTP/HTTPS URL                        |
| `interval_minutes` | INT     | Default 5                             |
| `is_active`        | BOOLEAN | Default true                          |
| `created_at`       | TIMESTAMPTZ |                                   |

### `error_groups`
Grouped summary row per distinct fingerprint. Occurrence count is
incremented on every repeat ingest.

| Column            | Type         | Notes                                             |
| ----------------- | ------------ | ------------------------------------------------- |
| `id`              | UUID PK      |                                                   |
| `project_id`      | UUID FK      |                                                   |
| `fingerprint`     | VARCHAR(64)  | SHA-256 over exception class + top-5 frames       |
| `exception_class` | VARCHAR(255) |                                                   |
| `title`           | VARCHAR(500) | First line of the error message                   |
| `level`           | VARCHAR(50)  | `error`, `warning`, `info`                        |
| `environment`     | VARCHAR(100) | `production`, `staging`, …                        |
| `status`          | VARCHAR(50)  | `unresolved` / `resolved` / `ignored`             |
| `occurrences`     | BIGINT       | Incremented on repeat                             |
| `first_seen`      | TIMESTAMPTZ  |                                                   |
| `last_seen`       | TIMESTAMPTZ  |                                                   |
| `trace_id`        | VARCHAR(255) | Optional APM correlation id                       |
| `created_at`      | TIMESTAMPTZ  |                                                   |

Unique constraint on `(project_id, fingerprint)` ensures a single
row per distinct exception per project.

## ClickHouse tables

Created by `clickhouse_schema.sql`.

### `seestack.errors`
Raw error events. Columnar storage suits high-volume writes and
time-range queries. 30-day TTL.

```
project_id UUID, fingerprint String, exceptionClass String,
message String, stack_trace String, level LowCardinality(String),
environment LowCardinality(String), release String,
user_id String, user_email String, user_ip String,
metadata String, timestamp DateTime64(3)
```

Engine: `MergeTree() ORDER BY (project_id, timestamp)`.

### `seestack.monitor_checks`
One row per scheduler check.

```
monitor_id UUID, project_id UUID,
status UInt8,               -- 1 = up, 0 = down
response_time_ms UInt32,
status_code UInt16,
timestamp DateTime64(3)
```

Engine: `MergeTree() ORDER BY (monitor_id, timestamp)`.

## Seed data

seeStack deliberately ships no seed data. On first boot the schema
is empty. The workflow is:

1. `POST /api/auth/register` creates a user + a default project
   (`My First Project`) + a default ingest API key.
2. Subsequent SDK ingests populate `error_groups` + `seestack.errors`.
3. `POST /api/v1/monitors` populates `monitor_configs`; the scheduler
   populates `seestack.monitor_checks`.

## Dropping everything

```bash
cd infra/docker
docker compose down -v    # wipes named volumes
```

The next `docker compose up` recreates empty databases and the next
backend boot re-runs the Flyway migration + ClickHouse initialiser.
