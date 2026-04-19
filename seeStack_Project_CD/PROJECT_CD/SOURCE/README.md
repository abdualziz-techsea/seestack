# seeStack — Source Code

The full source tree lives one level above this CD, at the repository
root. Key directories:

```
<repo>/
├── backend/                     Spring Boot 3.4.4 on Java 17
│   ├── src/main/java/com/seestack/
│   │   ├── modules/
│   │   │   ├── auth/            /api/auth/* — register, login, JWT
│   │   │   ├── teams/           users + projects + API keys
│   │   │   ├── errors/          /ingest/v1/errors + /api/v1/errors
│   │   │   └── monitors/        /api/v1/monitors + scheduler
│   │   ├── ingestion/           Kafka event records + ClickHouse writers
│   │   └── shared/              security, exception, config, utils
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── db/migration/V1__schema.sql     Consolidated Postgres schema
│   │   └── clickhouse/init.sql              Error + monitor-check tables
│   └── build.gradle
│
├── packages/
│   ├── shared/                  Shared TS types + API clients (errors,
│   │                            monitors, auth, notifications)
│   └── web/                     React + Vite + TypeScript dashboard
│       └── src/
│           ├── components/      AppShell, Sidebar, Topbar, shared UI
│           ├── features/
│           │   ├── auth/        LoginPage, RegisterPage
│           │   ├── overview/    OverviewPage + stats
│           │   ├── projects/    ProjectsPage + useProjects hook
│           │   ├── errors/      ErrorsPage + ErrorDetailPage
│           │   ├── monitors/    MonitorsPage + MonitorDetailPage
│           │   └── sdk-setup/   SdkSetupPage + CodeBlock
│           └── router.tsx
│
├── sdks/
│   ├── javascript/seestack-sdk.js   class SeeStack, zero deps
│   ├── java/SeeStack.java           class SeeStack, JDK-only
│   ├── python/seestack_sdk.py       class SeeStack, stdlib-only
│   └── examples/example-app.js      Runnable three-error demo
│
└── infra/
    └── docker/                  docker-compose.yml + init scripts
```

## How to build

See `../SETUP/SETUP.md` for the full walkthrough. The essentials:

```bash
# Backend
cd backend && gradle bootJar -x test

# Frontend
cd packages/web && pnpm install && pnpm dev
```

## How to run tests

```bash
cd backend && gradle test
```

Unit suites cover the two pieces of logic most worth verifying in
isolation:
- `ErrorFingerprintServiceTest` — 9 tests on the SHA-256 grouping.
- `MonitorSchedulerTest` — 10 tests on the up/down classification.

End-to-end validation (SDK → ingest → Postgres + ClickHouse →
dashboard) is documented in
`../DOCUMENTS/Final_Project_Report.md` §6.
