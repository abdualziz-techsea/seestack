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
│   │   │   ├── monitors/        /api/v1/monitors + scheduler
│   │   │   ├── security/        /api/v1/security-scans
│   │   │   ├── loadtest/        /api/v1/load-tests
│   │   │   └── ai/              /api/v1/errors/*/ai-analysis
│   │   ├── ingestion/           Kafka event records + ClickHouse writers
│   │   └── shared/              security, exception, config, utils
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── db/migration/V1__schema.sql     Core Postgres schema
│   │   ├── db/migration/V2__security_scans.sql
│   │   ├── db/migration/V3__load_tests.sql
│   │   ├── db/migration/V4__security_scan_analysis.sql
│   │   └── clickhouse/init.sql              ClickHouse telemetry tables
│   └── build.gradle
│
├── packages/
│   ├── shared/                  Shared TS types + API clients (errors,
│   │                            monitors, security, load tests, AI)
│   └── web/                     React + Vite + TypeScript dashboard
│       └── src/
│           ├── components/      AppShell, Sidebar, Topbar, shared UI
│           ├── features/
│           │   ├── auth/        LoginPage, RegisterPage
│           │   ├── overview/    OverviewPage + stats
│           │   ├── projects/    ProjectsPage + useProjects hook
│           │   ├── errors/      ErrorsPage + ErrorDetailPage
│           │   ├── monitors/    MonitorsPage + MonitorDetailPage
│           │   ├── security-scan/ SecurityScanPage
│           │   ├── load-test/   LoadTestPage
│           │   └── sdk-setup/   SdkSetupPage + CodeBlock
│           └── router.tsx
│
├── sdks/
│   ├── javascript/seestack-sdk.js   class SeeStack, zero deps
│   ├── java/SeeStack.java           class SeeStack, JDK-only
│   ├── python/seestack_sdk.py       class SeeStack, stdlib-only
│   └── examples/example-app.js      Runnable three-error demo
│
├── infra/
│   └── docker/                  docker-compose.yml + init scripts
│
└── docs/                        Next.js + Fumadocs SDK/API docs app
```

The backend reads `OPENAI_API_KEY` from the process environment for
AI-assisted error analysis. The key is optional, is never stored in
source code, and is only used when the user requests analysis from an
error detail page.

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

Unit suites cover the main backend logic worth verifying in
isolation:
- `ErrorFingerprintServiceTest` — 9 tests on the SHA-256 grouping.
- `MonitorSchedulerTest` — 10 tests on the up/down classification.
- `ErrorInsightsServiceTest` — explainable error insight summaries.
- `ErrorDataSanitizerTest` — redaction before AI analysis.
- `SecurityAnalyzerTest` — security header/risk analysis behavior.
- `LoadTestRunnerLimitsTest` — public Basic Load Test limits.
- `ApiKeyGeneratorServiceTest` — ingest-key format and hashing.

End-to-end validation (SDK → ingest → Postgres + ClickHouse →
dashboard) is documented in
`../DOCUMENTS/Final_Project_Report.md` §10.
