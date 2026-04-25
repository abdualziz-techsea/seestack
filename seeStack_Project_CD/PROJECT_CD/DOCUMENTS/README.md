# seeStack — Project CD

This CD contains everything needed to read, run, and evaluate the
seeStack graduation project.

## What is seeStack?

A focused developer tool with two responsibilities:

1. **Error Monitoring.** Applications ship runtime exceptions to
   seeStack using a zero-dependency SDK and a project-scoped ingest
   key. The backend buffers events on Kafka, groups repeats by a
   stable SHA-256 fingerprint, and surfaces them in a web dashboard.
2. **Website Monitoring.** Users register URLs with a check interval.
   A scheduler performs periodic HTTP GETs, classifies each check as
   up or down (`2xx/3xx ∧ < 30 s`), and records uptime history in
   ClickHouse.

Authentication is internal: email + password, BCrypt-hashed, with an
HS256 JWT issued by the backend. There is **no external identity
provider, no OAuth, no billing, and no multi-tenant organization
concept** in the system.

## CD layout

```
PROJECT_CD/
├── Group Description.txt          Team members + short project summary
├── DOCUMENTS/
│   ├── README.md                  (this file)
│   ├── Final_Project_Report.md    Full technical report + runtime evidence
│   ├── Final_Project_Report_OnePager.md  1-page summary
│   └── Final_Project_Report.pdf   (if generated — see instructions below)
├── PREREQUISITES/
│   └── README.md                  Exact tool versions required to run
├── SETUP/
│   └── SETUP.md                   Step-by-step local run instructions
├── SOURCE/
│   └── README.md                  Where the source tree lives + run commands
└── DATABASE/
    ├── README.md / DATABASE_README.md  Schema overview
    └── schema.sql                 Consolidated PostgreSQL schema
```

## Quick start

From the repository root:

```bash
# 1. Start infrastructure
docker compose -f infra/docker/docker-compose.yml up -d postgres redis clickhouse kafka

# 2. Build and run the backend
cd backend
./gradlew bootJar -x test
SEESTACK_JWT_SECRET=dev-insecure-change-me-in-production-32chars \
POSTGRES_HOST=localhost POSTGRES_PORT=5433 \
POSTGRES_DB=seestack POSTGRES_USER=seestack POSTGRES_PASSWORD=change-me-strong-password \
REDIS_HOST=localhost REDIS_PORT=16379 REDIS_PASSWORD=devredis \
KAFKA_BOOTSTRAP_SERVERS=localhost:19092 \
CLICKHOUSE_HOST=localhost CLICKHOUSE_PORT=18123 CLICKHOUSE_DB=seestack CLICKHOUSE_USER=default \
  java -jar build/libs/seestack-backend-0.0.1-SNAPSHOT.jar &

# 3. Run the frontend
cd ../packages/web
pnpm install
pnpm dev    # serves http://localhost:3002
```

Open `http://localhost:3002/register`, create an account, then explore
**Overview · Projects · Errors · Monitors · SDK Setup**.

## How to generate the PDF report

The report is authored in Markdown. To produce
`Final_Project_Report.pdf`, run **one** of:

```bash
# Using Pandoc + any TeX distribution
pandoc DOCUMENTS/Final_Project_Report.md \
  -o DOCUMENTS/Final_Project_Report.pdf \
  --from=gfm --pdf-engine=xelatex --toc
```

```bash
# Or open the .md file in any markdown viewer (VS Code, Typora,
# Obsidian, GitHub) and "Export as PDF".
```

The Markdown source is the canonical artifact; the PDF is a
convenience rendering. If no PDF is present on the CD, the grader can
regenerate it from the .md with either command above.
