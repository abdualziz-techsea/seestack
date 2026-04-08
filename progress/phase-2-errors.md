# Phase 2 — Error Monitoring

Status: ✅ Done
Branch: feature/errors-phase2
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] Kafka topic: seestack.errors (created in Phase 1 KafkaTopicsConfig)
- [x] V11 Flyway migration: error_groups table (fingerprint, status, counts, first/last seen)
- [x] ApiKeyAuthFilter — validates X-SeeStack-Key header on /ingest/** endpoints
- [x] ApiKeyService — SHA-256 hashing, DB lookup via ApiKeyRepository (JdbcClient)
- [x] POST /ingest/v1/errors endpoint (ErrorIngestController)
- [x] Input validation (@Valid on ErrorIngestRequest)
- [x] ErrorFingerprintService — SHA-256 of exception class + top 5 app frames
- [x] ErrorKafkaEvent — typed Kafka message payload record
- [x] ErrorKafkaConsumer — consumes seestack.errors, manual ack, concurrency=3
- [x] ErrorClickHouseWriter — writes to seestack.errors ClickHouse table
- [x] ErrorGroupService — upsert logic (increment or insert), status update
- [x] GET /api/v1/errors — list with filters (status, level, environment, pagination)
- [x] GET /api/v1/errors/{fingerprint} — error group detail
- [x] PATCH /api/v1/errors/{fingerprint}/status — resolve/ignore/unresolve
- [x] Unit tests for fingerprint logic (ErrorFingerprintServiceTest — 9 tests)
- [x] SecurityConfig updated to wire ApiKeyAuthFilter

## Testing

All curl tests passed on: 2026-03-27

- Ingest endpoint: PASS
- Fingerprint grouping (occurrences=2): PASS
- API key auth: PASS
- Validation errors: PASS
- List / filter / detail endpoints: PASS
- Status updates (resolve/ignore): PASS
- ClickHouse data verified: PASS
- PostgreSQL groups verified: PASS

## Bugs Fixed

1. **ClickHouse schema missing `exceptionClass` column** — Added to both init SQL files and updated `ErrorClickHouseWriter`.
2. **ClickHouse TTL on DateTime64** — Wrapped with `toDateTime()` for ClickHouse 24 compatibility.
3. **Dockerfile Java version mismatch** — Changed from JDK 25 to JDK 17 to match toolchain config.
4. **Flyway picking up ClickHouse datasource** — Explicitly set `spring.flyway.url/user/password` for PostgreSQL.
5. **Hibernate using ClickHouse datasource** — Added `@Primary` PostgreSQL datasource config.
6. **httpclient5 version conflict** — Let Spring Boot manage the version.
7. **Keycloak schema missing** — Added `postgres-init/00_init_schemas.sql` for docker-compose.
8. **Pagination 0-indexed vs 1-indexed** — Fixed `PageRequest.of(page - 1, ...)`.
9. **Optional query params treated as required** — Added `required = false` to optional `@RequestParam`.
10. **JWT issuer URI mismatch** — Removed `issuer-uri`, kept only `jwk-set-uri`.
11. **Redis empty password** — Set non-empty dev password in `.env`.

## Notes

- error_groups in PostgreSQL stores aggregated group data (status, counts)
- Individual error occurrences live in ClickHouse only
- Consumer uses manual ack mode — failed messages are retried (not acked on exception)
- Fingerprint algorithm: SHA-256( firstLine | top-5-non-internal-frames )
- Internal frames (Spring, JDK, Apache) are skipped in fingerprinting for stability
