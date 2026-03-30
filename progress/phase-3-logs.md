# Phase 3 — Logs

Status: Done
Branch: feature/logs-phase3
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] POST /ingest/v1/logs endpoint (LogIngestController, API key auth)
- [x] Kafka consumer -> ClickHouse writer (LogKafkaConsumer, LogClickHouseWriter)
- [x] GET /api/v1/logs (list, filter by service/level/time range, pagination)
- [x] Live tail via WebSocket (/api/v1/logs/tail, LogTailBroadcaster)

## Testing

All curl tests passed on: 2026-03-27

- Log ingest (all 5 levels): PASS
- API key auth (401 on invalid): PASS
- Validation errors (422 on missing/invalid fields): PASS
- List all logs: PASS (5 logs returned)
- Filter by level: PASS (1 error log)
- Filter by service: PASS (2 payment-service logs)
- Filter by time range (1h/24h/7d/30d): PASS
- Combined filters (level + service): PASS
- Pagination: PASS (page 1 = 2 items, page 2 = 2 items)
- ClickHouse data verified: PASS (5 rows, all levels/services correct)
- WebSocket live tail: PASS (101 handshake, register/unregister in logs)
- Phase 2 regression: PASS (error endpoints still work)

## Bugs Fixed

1. **JSpecify @Nullable on fully-qualified type** — `@Nullable java.util.Map<>` not allowed; must use imported `Map` type.
2. **ClickHouse timestamp parameter formatting** — `java.sql.Timestamp` and ISO-8601 with trailing `Z` not parseable by ClickHouse; fixed with `DateTimeFormatter` formatting to `yyyy-MM-dd HH:mm:ss.SSS`.

## Notes

- Logs are stored ONLY in ClickHouse (no PostgreSQL entity unlike error_groups)
- Query endpoint reads directly from ClickHouse via JDBC (not JPA)
- WebSocket live tail broadcasts from Kafka consumer to all connected sessions filtered by project_id
- Metadata stored as JSON string in ClickHouse
- ClickHouse TTL: 14 days retention
