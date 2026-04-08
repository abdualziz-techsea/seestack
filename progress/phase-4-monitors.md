# Phase 4 — Website Monitor

Status: Done
Branch: feature/monitors-phase4
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] Monitor config CRUD (POST/GET/PUT/DELETE /api/v1/monitors)
- [x] Scheduler (check every 1/5/10 minutes via @Scheduled + Java HttpClient)
- [x] Store results in ClickHouse via Kafka (seestack.monitor-checks topic)
- [x] Check history endpoint (GET /api/v1/monitors/{id}/checks with uptime %)
- [x] Unit tests for up/down determination logic (10 tests)

## Testing

All curl tests passed on: 2026-03-27

- Create monitor (201): PASS
- Create with invalid URL (422): PASS
- List monitors (2 items): PASS
- Get monitor detail: PASS
- Update monitor (name, interval): PASS
- Scheduler runs checks automatically: PASS
- ClickHouse has check results (UP + DOWN): PASS
- Check history with uptime % (100% UP monitor): PASS
- Down monitor shows 0% uptime: PASS
- Delete monitor (204): PASS
- Phase 2 + Phase 3 regression: PASS

## Notes

- Scheduler runs every 60s, respects per-monitor interval_minutes
- UP = HTTP 2xx/3xx AND response time < 30s
- DOWN = HTTP 4xx/5xx OR timeout OR connection failure
- Check results stored in ClickHouse with 90-day TTL
- Uptime calculated as (UP checks / total checks * 100)
- Downtime alerts deferred to Phase 8 (needs notification infrastructure)
