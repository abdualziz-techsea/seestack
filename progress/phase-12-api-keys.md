# Phase 12 — API Key Management

Status: Done
Branch: feature/billing-phase10
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] V18: Add key_prefix, environment, created_by to api_keys
- [x] ApiKeyGeneratorService (ask_live_ / ask_test_ prefixes, SecureRandom)
- [x] POST /api/v1/api-keys (raw key returned ONCE)
- [x] GET /api/v1/api-keys?projectId= (key hidden)
- [x] PATCH /api/v1/api-keys/{id} (rename)
- [x] DELETE /api/v1/api-keys/{id} (revoke)
- [x] ApiKeyGeneratorServiceTest (7 tests)

## Testing

- Create production key (ask_live_ prefix): PASS
- Create test key (ask_test_ prefix): PASS
- List keys (key hidden in response): PASS
- Regression: PASS
