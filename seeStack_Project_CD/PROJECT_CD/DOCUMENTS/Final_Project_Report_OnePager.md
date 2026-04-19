# seeStack — One-Page Summary

**What it is.** A focused graduation-project monitoring tool. A user
signs up, owns projects directly, and each project receives errors
from an SDK and watches a list of websites.

**No organizations · no memberships · no billing · no subscriptions ·
no plans · no OAuth.** Just user → projects → errors + monitors.

## Dashboard
Five pages: **Overview · Projects · Errors · Monitors · SDK Setup**,
plus **Login** and **Register**.

- **Register** `/register` — name + email + password, auto-creates a
  default project with an API key, logs the user in.
- **Login** `/login` — email + password.
- **Projects** `/projects` — real list, create form, one-time reveal
  of the raw ingest key on creation, select button to switch.
- **Errors** `/errors` — grouped-issue table with filters.
- **Error detail** `/errors/:fingerprint` — full page (no drawer)
  with fingerprint, exception, stack trace, occurrence count,
  project badge, Mark-resolved / Ignore actions.
- **Monitors** `/monitors` — card grid with current status, last
  response time, uptime %.
- **SDK Setup** `/sdk-setup` — project picker, one-time ingest-key
  reveal, copy-able install / init / capture snippets for three
  languages (JavaScript / Java / Python). No OAuth, no identity
  provider in the flow.

## Data model
Six tables only: `users`, `projects`, `api_keys`, `monitor_configs`,
`error_groups`, `flyway_schema_history`. All ~30 legacy migrations
replaced by one consolidated `V1__schema.sql`.

## Stack
Java 17 · Spring Boot 3.4.4 · PostgreSQL 16 · ClickHouse 24 · Apache
Kafka 3.8 (KRaft) · Redis 7 · React + Vite + TypeScript · Docker
Compose. Auth = BCrypt + HS256 JWT written in-house.

## This iteration removed
- Everything `organization` — entity, service, repo, controller,
  DTOs, FKs, migrations, JWT `orgId` claim, shared `Organization`
  type, Zustand `org` state, frontend org selectors.
- All unused backend modules: alerts, chat, cron, flags, logs,
  replay, requests, ssh, project_members, OrgSettings,
  ApiKeyController / ApiKeyManagementController /
  ApiKeyManagementService.
- The error-detail drawer (`ErrorDetailSheet.tsx`) and `BulkActionsBar`.
- Backend deps: `spring-boot-starter-websocket`, `sshd-core`, and the
  `SSH_ENCRYPTION_KEY` env var.

## This iteration added
- `/sdk-setup` route + `SdkSetupPage` with project picker, one-time
  ingest-key reveal, and JS / Java / Python snippets.
- Three zero-dep SDKs under `sdks/`: `javascript/seestack-sdk.js`
  (class `SeeStack`), `java/SeeStack.java`, `python/seestack_sdk.py`.
- Consistent naming: "seeStack" branding across SDK files, READMEs,
  dashboard labels, snippets, and comments.
- `/register` route + `RegisterPage`.
- `/projects` route + `ProjectsPage` with live list, create, and
  one-time API-key reveal.
- `/errors/:fingerprint` full-page `ErrorDetailPage`.
- `GET/POST/DELETE /api/v1/projects` backed by `user_id`.
- `CurrentUser.requireUserId()` helper reading the JWT principal.

## Cleanup done in this iteration
- Deleted `packages/allstak-js/` and `packages/allstak-python/`.
- Deleted `RequestContext.java` / `RequestContextFilter.java` (still
  carried a `keycloakId` field).
- Deleted `packages/web/.env.example` (`VITE_KEYCLOAK_*` vars).
- Rewrote `WebConfig.java` to an empty shell.
- Rewrote SDK `README.md` so it no longer frames itself in terms of
  what Keycloak / OAuth *isn’t* — just describes the ingest-key flow.

## Runtime verification (live this run)
- Backend boots on fresh infra; `\dt` lists **only** six tables; no
  `org_id` / `plan` / `subscription` anywhere.
- `POST /api/auth/register` → 201 + JWT + default project.
- `POST /api/v1/projects` → 201 with one-time raw API key.
- SDK → 3× 202; grouped in PG/CH.
- Two monitors created → scheduler UP 200 / DOWN 0.
- **Chrome MCP**: registered Ada via the form → `/overview`;
  sidebar = Overview · Projects · Errors · Monitors; Projects page
  lists both projects with `ask_live_` prefix; Errors list shows 3
  rows; clicking a row navigates to
  `/errors/693c9dff33ea…` full-page detail (no drawer); Monitors
  page shows `example.com` Operational + `127.0.0.1:1` Down. Text
  scan of the dashboard confirms no `organization`, `billing`,
  `subscription`, `pricing`, `upgrade`, or `plan` words anywhere.
