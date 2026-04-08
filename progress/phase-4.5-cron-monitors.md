# Phase 4.5 — Cron Job / Scheduled Task Monitoring

Status: Done
Branch: feature/cron-monitors-phase4.5
Started: 2026-03-28
Completed: 2026-03-28

## Tasks

### Schema & Config
- [x] Flyway migration V21: cron_monitors table (PostgreSQL)
- [x] ClickHouse table: cron_pings (via init SQL + ApplicationRunner)
- [x] Kafka topic: seestack.cron_pings (3 partitions)

### Ingestion
- [x] POST /ingest/v1/heartbeat endpoint (API key auth)
- [x] Input validation (slug required, status must be success|failed)
- [x] CronPingKafkaProducer — publishes to seestack.cron_pings
- [x] CronPingKafkaConsumer → CronPingClickHouseWriter

### CRUD API
- [x] POST /api/v1/cron-monitors
- [x] GET /api/v1/cron-monitors?projectId= (live status enriched)
- [x] GET /api/v1/cron-monitors/{id}
- [x] PUT /api/v1/cron-monitors/{id}
- [x] DELETE /api/v1/cron-monitors/{id}
- [x] GET /api/v1/cron-monitors/{id}/history

### Scheduler
- [x] CronEvaluatorScheduler — runs every 60s
- [x] Detects missed jobs + deduplication guard
- [x] Detects duration spikes (actual > avg * 1.5)

### Alert Integration
- [x] job_missed → AlertEvaluationService
- [x] job_failed → AlertEvaluationService
- [x] job_duration_spike → AlertEvaluationService

### Unit Tests
- [x] CronStatusDetectionTest (7 tests — including boundary conditions)
- [x] DurationSpikeTest (3 tests)
- [x] CronScheduleParserTest (5 tests)

## Testing

All curl tests passed on: 2026-03-28
- Create monitor (201, pending): PASS
- Duplicate slug (409): PASS
- Invalid slug format (422): PASS
- Heartbeat success (202): PASS
- Monitor status → healthy after ping: PASS
- Heartbeat failed (202): PASS
- Monitor status → failed after failed ping: PASS
- Unknown slug (404): PASS
- Invalid API key (401): PASS
- Invalid status (422): PASS
- Monitor detail + history: PASS
- Update monitor: PASS
- ClickHouse row count verified: PASS
- Delete monitor (204): PASS
- Phase 2-4 regression: PASS

## Notes
- Status transitions: pending → healthy → late → missed
- missed pings are synthetic — written by CronEvaluatorScheduler, not the job
- Deduplication: hasMissedPingAfter() prevents duplicate missed events on every scheduler tick
- Slug is immutable after creation — cannot be changed via PUT
- Schedule supports both interval shorthand (5m, 1h, 1d) and standard 5-field cron expressions
