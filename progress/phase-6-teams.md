# Phase 6 — Teams & Permissions

Status: Done
Branch: feature/teams-phase6
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] Organization CRUD (POST/GET/PUT/DELETE /api/v1/organizations)
- [x] Project CRUD (POST/GET/PUT/DELETE /api/v1/projects)
- [x] Project-level permissions (errors/logs/monitors/ssh per member)
- [x] Permission check endpoint (GET /api/v1/projects/{id}/members/check)
- [x] API Keys management (create with revealed key, list, rename, delete)
- [x] Unit tests for permission check logic (6 tests)

## Testing

All curl tests passed on: 2026-03-27

- Create organization (201): PASS
- List organizations (2 items): PASS
- Validation error on invalid slug (422): PASS
- Create project (201 with platform): PASS
- List projects (2 items): PASS
- Add member with granular permissions (201): PASS
- Check permission errors=allowed: PASS
- Check permission ssh=denied: PASS
- Update permissions to grant SSH: PASS
- Check permission ssh=now allowed: PASS
- Create API key (key revealed once): PASS
- List API keys (key hidden): PASS
- New API key works for ingestion (202): PASS
- Delete API key (204): PASS
- Phase 2-5 regression: PASS

## Notes

- Organizations have slugs (lowercase alphanumeric + hyphens)
- Projects scoped to organizations with unique slugs per org
- Project members have 4 independent permission flags: can_errors, can_logs, can_monitors, can_ssh
- SSH permission must be explicitly granted (never inherited)
- API keys generated with ask_ prefix, SHA-256 hashed for storage
- Raw key shown only on creation, never again
- Created keys work immediately with the ingest API
