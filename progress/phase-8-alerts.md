# Phase 8 — Alerts & Notifications

Status: Done
Branch: feature/alerts-notification-module
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

### Schema & Config
- [x] V12 Flyway migration: extend alert_rules table
- [x] V13 Flyway migration: notification_log table
- [x] V14 Flyway migration: add timezone to organizations

### Core Services
- [x] AlertRuleService — CRUD (create, list, update, delete, enable/disable toggle)
- [x] AlertEvaluationService — evaluate all 5 trigger types
- [x] NotificationDispatcherService — routes to correct channel(s)
- [x] QuietHoursService — checks if current time is in quiet window

### Channel Implementations
- [x] SlackNotificationService — webhook POST with Block Kit payload
- [x] DiscordNotificationService — webhook POST with Embed payload
- [x] EmailNotificationService — Azure scaffold (logs warning, no credentials)
- [x] PushNotificationService — OneSignal scaffold (logs warning, no credentials)

### Trigger Integrations
- [x] Wire new error (first seen) -> AlertEvaluationService (ErrorGroupService)
- [x] Wire monitor down -> AlertEvaluationService (MonitorScheduler)
- [x] Wire monitor response time threshold -> AlertEvaluationService (MonitorScheduler)
- [x] Wire SSH session start -> AlertEvaluationService (SshTerminalWebSocketHandler)

### API Endpoints
- [x] POST /api/v1/alert-rules
- [x] GET /api/v1/alert-rules?projectId=
- [x] GET /api/v1/alert-rules/{id}
- [x] PATCH /api/v1/alert-rules/{id}
- [x] DELETE /api/v1/alert-rules/{id}
- [x] PATCH /api/v1/alert-rules/{id}/toggle
- [x] GET /api/v1/notification-log?projectId=

### Tests
- [x] QuietHoursServiceTest — 4 tests
- [x] Integration test: new error triggers notification log entry

## Testing

All curl tests passed on: 2026-03-27

- Create alert rule with Slack channel (201): PASS
- Create rule with Discord + quiet hours (201): PASS
- Create rule with Email scaffold (201): PASS
- List alert rules (3 items): PASS
- Get rule detail: PASS
- Toggle rule disable/enable: PASS
- Trigger new_error alert via error ingest: PASS
- Notification log captured email send: PASS
- Delete rule (200): PASS
- Phase 2-7 regression: PASS

## Notes

- Slack and Discord fully implemented (HTTP webhook POST)
- Email (Azure) and Push (OneSignal) are scaffolded only
- Scaffold services log warnings and never throw
- Notification log tracks sent/failed/skipped_quiet_hours status
- Alert rules support 5 trigger types: error_spike, new_error, monitor_down, monitor_response_time, ssh_session_started
- Severity filter: "all" or "critical" only
- Quiet hours: overnight range support (e.g. 23:00-08:00)
