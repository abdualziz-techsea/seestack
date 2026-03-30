# Phase 11 — Organization Settings

Status: Done
Branch: feature/billing-phase10
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] V17: Add allowed_email_domains, deleted_at to organizations
- [x] GET /api/v1/org/settings
- [x] PATCH /api/v1/org/settings (name, slug, timezone validation)
- [x] POST /api/v1/org/export (GDPR async export)
- [x] DELETE /api/v1/org (danger zone with confirmation)

## Testing

- Get org settings: PASS
- Update timezone: PASS
- Invalid timezone rejected (422): PASS
- GDPR export queued (202): PASS
- Delete without confirmation rejected (422): PASS
