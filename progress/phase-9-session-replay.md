# Phase 9 — Session Replay

Status: Done
Branch: feature/session-replay-phase9
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] ClickHouse table: replay_events (with 30-day TTL)
- [x] Kafka topic: allstak.replay (3 partitions)
- [x] POST /ingest/v1/replay endpoint (API key auth)
- [x] Input validation (fingerprint, sessionId, events required)
- [x] InputMaskingService — password, credit card, sensitive field redaction
- [x] ReplayKafkaConsumer -> ReplayClickHouseWriter pipeline
- [x] GET /api/v1/errors/{fingerprint}/replay (JWT auth)
- [x] Unit tests for InputMaskingService (8 tests)

## Testing

All curl tests passed on: 2026-03-27

- Ingest replay events (202, 6 events): PASS
- Invalid API key (401): PASS
- Validation errors (422): PASS
- Query replay events (3 events): PASS
- Password masked (***REDACTED***): PASS
- Credit card masked (****-****-****-1234): PASS
- Unknown fingerprint returns 0 events: PASS
- Phase 2-8 regression: PASS

## Bugs Fixed

1. **ClickHouse JDBC PreparedStatement reuse** — Fixed by using separate connection per event write.
2. **replay_events table not auto-created** — Added to both ClickHouse init SQL files.

## Notes

- Events stored in ClickHouse only (no PostgreSQL)
- Linked to errors via fingerprint field
- Privacy masking happens server-side at ingest time
- 30-day retention (ClickHouse TTL)
