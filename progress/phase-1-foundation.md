# Phase 1 — Foundation

Status: ✅ Done
Branch: feature/foundation-backend-setup
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] Spring Boot 4 project setup (Java 25, Gradle 9)
- [x] application.properties with env variable placeholders
- [x] Docker Compose — all infrastructure services (PostgreSQL 16, ClickHouse 24, Kafka KRaft, Redis 7, Keycloak 25)
- [x] Flyway migrations — all 10 PostgreSQL tables
- [x] ClickHouse schema initialization script (init.sql + ApplicationRunner bean)
- [x] Keycloak OAuth2 Resource Server integration (SecurityConfig)
- [x] JWT filter + Scoped Values request context (RequestContextFilter)
- [x] GlobalExceptionHandler with standard API response format
- [x] /actuator/health endpoint (via Spring Boot Actuator)
- [x] CI pipeline (.github/workflows/ci.yml)

## Notes

- Used `ScopedValue.runWhere` (Java 25) for immutable per-request context instead of ThreadLocal
- ClickHouse schema init runs as an `ApplicationRunner` bean at startup
- Kafka topics auto-created via `NewTopic` beans (KRaft mode, no ZooKeeper)
- Virtual threads enabled via `spring.threads.virtual.enabled=true`
- All secrets use environment variable placeholders — no hardcoded values
- `javax.*` imports are entirely absent — all imports use `jakarta.*`
