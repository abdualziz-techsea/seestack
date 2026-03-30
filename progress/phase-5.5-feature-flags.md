# Phase 5.5 — Feature Flags

Status: Done
Branch: feature/feature-flags-phase5.5
Started: 2026-03-28
Completed: 2026-03-28

## Tasks

### Schema
- [x] Flyway V24: feature_flags table
- [x] Flyway V25: flag_audit_log table
- [x] Flyway V26: add can_flags to project_members

### CRUD API
- [x] POST /api/v1/flags
- [x] GET /api/v1/flags?projectId=
- [x] GET /api/v1/flags/{key}?projectId=
- [x] PUT /api/v1/flags/{key}
- [x] DELETE /api/v1/flags/{key}?projectId=
- [x] PATCH /api/v1/flags/{key}/toggle?projectId=
- [x] GET /api/v1/flags/{key}/audit?projectId=

### Evaluation API
- [x] GET /api/v1/flags/evaluate (bulk, Redis cached 30s)
- [x] GET /api/v1/flags/{key}/evaluate (single)
- [x] FlagEvaluationService — MurmurHash3 consistent rollout
- [x] FlagEvaluationService — targeting rules (force > rollout > attributes > default)

### Alert Integration
- [x] flag_error_spike trigger wired in AlertEvaluationService

### Unit Tests
- [x] FlagEvaluationServiceTest — 10 tests covering all evaluation paths

## Testing

All curl tests passed on: 2026-03-28
- Create boolean flag (201): PASS
- Duplicate key (409): PASS
- Invalid key format (422): PASS
- Create multi-variant string flag (201): PASS
- Toggle on/off: PASS
- Evaluate — DEFAULT (rollout=0): PASS
- Evaluate — PERCENTAGE_ROLLOUT (rollout=100): PASS
- Consistent hash verified (same userId same variant): PASS
- Bulk evaluate with attribute rule: PASS
- Audit log (3 entries): PASS
- Disabled flag → DISABLED reason: PASS
- Delete (204): PASS
- Phase 2-5 regression: PASS

## Notes
- Flag key is immutable after creation
- MurmurHash3(userId:flagKey) % 100 for consistent bucketing
- Redis cache key: "flags:{projectId}" — TTL 30s, invalidated on any write
- Audit log uses PostgreSQL (not ClickHouse) — queryable by flag_id
- Evaluation order: DISABLED → FORCE_OVERRIDE → PERCENTAGE_ROLLOUT → ATTRIBUTE_RULE → DEFAULT
