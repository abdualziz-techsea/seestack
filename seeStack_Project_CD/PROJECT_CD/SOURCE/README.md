# seeStack — Source Code

This `SOURCE/` folder contains the full source tree of the
delivered seeStack senior project, copied as-is from the development
repository with build artefacts and runtime files removed.

## Layout

```
SOURCE/
├── backend/                 Spring Boot 3.4.4 on Java 17 (Gradle)
│   ├── src/main/java/com/seestack/
│   │   ├── modules/
│   │   │   ├── auth/        /api/auth/* — register, login, JWT
│   │   │   ├── teams/       users + projects + API keys
│   │   │   ├── errors/      /ingest/v1/errors + /api/v1/errors
│   │   │   ├── monitors/    /api/v1/monitors + scheduler
│   │   │   ├── security/    /api/v1/security-scans
│   │   │   ├── loadtest/    /api/v1/load-tests
│   │   │   └── ai/          /api/v1/errors/*/ai-analysis
│   │   ├── ingestion/       Kafka event records + ClickHouse writers
│   │   └── shared/          security, exception, config, utils
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── db/migration/V1__schema.sql
│   │   ├── db/migration/V2__security_scans.sql
│   │   ├── db/migration/V3__load_tests.sql
│   │   ├── db/migration/V4__security_scan_analysis.sql
│   │   └── clickhouse/init.sql
│   └── build.gradle
│
├── packages/
│   ├── shared/              Shared TypeScript types + API clients
│   └── web/                 React + Vite + TypeScript dashboard
│
├── sdks/
│   ├── javascript/          Node.js SDK (zero deps)
│   ├── java/                Java SDK (JDK only)
│   ├── python/              Python SDK (stdlib only)
│   └── examples/            Runnable SDK demos
│
├── infra/
│   └── docker/              docker-compose.yml + init scripts
│
├── docs/                    Next.js + Fumadocs documentation site
│
├── scripts/
│   ├── seed-demo.sh         Creates demo account + seeded data
│   ├── generate-test-error.sh
│   └── regression-no-frequency-text.sh
│
├── run-demo.sh              One-command demo launcher
├── run-sdk-demo.sh          One-command SDK demo
├── test-error.sh            Sends three test errors to the backend
├── package.json             pnpm workspace root
├── pnpm-workspace.yaml      pnpm workspace config
└── tsconfig.base.json       Shared TypeScript base config
```

## Authentication

Internal email + password only. Passwords are stored as BCrypt
hashes; on successful login the backend issues an HS256-signed JWT
that is sent as a Bearer token on subsequent requests. There is no
Keycloak, no OAuth, no magic link, and no one-time-password flow.

## AI integration

The backend reads `OPENAI_API_KEY` from the environment for
AI-assisted error analysis. The key is optional, is never stored in
source code, and is only used when the user clicks **Explain &
Suggest Fix** on an error detail page. With the key unset the
endpoint returns `AI_NOT_CONFIGURED` and the dashboard shows a clear
not-configured message.

## How to build

See `../SETUP/SETUP.md` for the full walkthrough or
`../SETUP/DEMO_GUIDE.md` for the one-command path. The essentials:

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

- `ErrorFingerprintServiceTest` — SHA-256 grouping
- `MonitorSchedulerTest` — up/down classification
- `ErrorInsightsServiceTest` — explainable error insight summaries
- `ErrorDataSanitizerTest` — redaction before AI analysis
- `SecurityAnalyzerTest` — security header / risk analysis
- `LoadTestRunnerLimitsTest` — Basic Load Test capped limits
- `ApiKeyGeneratorServiceTest` — ingest-key format and hashing

## What is NOT in this source tree

The following are intentionally not part of the delivered system and
do not appear in the code: chat / messaging module, SSH manager,
mobile app, billing / subscription / pricing, third-party identity
providers (Keycloak, OAuth), and any predictive-analytics or
machine-learning model trained in-house.
