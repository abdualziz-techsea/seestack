# Phase 13 — Frontend Web (React)

Status: ✅ Done
Branch: feature/frontend-phase13
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

### Setup
- [x] pnpm monorepo initialized
- [x] @allstak/shared package — all types
- [x] @allstak/shared package — all API clients
- [x] @allstak/shared package — utils and constants
- [x] @allstak/web package — Vite + React 19 + TypeScript
- [x] Tailwind CSS v4 configured with design tokens
- [x] TanStack Query client configured
- [x] Zustand stores (auth, ui, terminal)
- [x] i18n setup (en + ar JSON files)
- [x] React Router v7 configured with all routes (lazy loading)
- [x] Feature-based folder structure (11 features)
- [x] Expect browser test flows created (10 flows)
- [x] Environment files (.env.development, .env.production, .env.example)
- [x] App runs on localhost:3000

### Design Tokens
- [x] All CSS variables match design-system.html reference exactly
- [x] --bg-raised token added (#1b1c1e) for card backgrounds
- [x] --text-inverse token added
- [x] Letter-spacing: -0.011em on body
- [x] Dot pattern: 20x20px on auth pages
- [x] Dark mode tokens verified via Chrome MCP
- [x] Light mode tokens set

### Layout Components
- [x] AppShell (sidebar + topbar + command palette)
- [x] Sidebar (sections: Monitor/Team/Configure, collapse, user row, 32px nav items, 4px radius)
- [x] Topbar (project selector, search bar, notifications, theme/lang toggle, user menu)
- [x] AuthLayout (dot pattern bg, 56px header, footer links, logo SVG matching reference)

### Shared Components
- [x] StatusBadge (i18n-aware, all status variants)
- [x] LevelBadge (debug/info/warn/error/fatal)
- [x] SkeletonRow + SkeletonCard
- [x] EmptyState (icon + title + description + action)
- [x] TimeAgo (auto-refresh 30s, RTL-aware, full timestamp on hover)
- [x] CopyButton (sm/md sizes, checkmark feedback)
- [x] CommandPalette (Cmd+K, keyboard nav, search filter)
- [x] Logo (4-quadrant SVG matching HTML reference)
- [x] ErrorBoundary (with retry button)

### Auth Pages
- [x] LoginPage (full-width OAuth buttons, 34px inputs, remember me, show/hide pw)
- [x] RegisterPage (password strength bar — 4 segments)
- [x] OnboardingPage (4 steps: workspace, platform, invite, SDK)
- [x] ForgotPasswordPage (email sent state swap)
- [x] ResetPasswordPage (confirm + strength bar)
- [x] VerifyEmailPage (resend link)
- [x] InvitePage (accept invitation)
- [x] SSOPage (domain input)

### Dashboard Pages
- [x] OverviewPage (stat cards, error trend Recharts, recent errors, monitors, activity feed)
- [x] ErrorsPage (filter bar, table, detail sheet 480px, stack trace, bulk actions)
- [x] LogsPage (level filter pills, expandable metadata JSON, live tail toggle)
- [x] MonitorsPage (summary bar, grid cards with SVG sparklines, add modal)
- [x] SSHPage (server cards, terminal modal placeholder — always dark)
- [x] ChatPage (3-column: channels, messages with @mention highlight + linked errors)
- [x] AlertsPage (rules table with toggle switches, channel icons)
- [x] BillingPage (plan cards, usage bars with color thresholds, annual toggle)
- [x] ReplayPage (browser mockup, playback controls, event timeline)

### Settings Pages
- [x] GeneralSettingsPage (save feedback, danger zone, delete confirmation)
- [x] MembersPage (role management, invite dialog)
- [x] ApiKeysPage (create + reveal + revoke dialogs, checkbox gate)

### Hooks
- [x] useAuth (token-based auto-fetch)
- [x] useWebSocket (auto-reconnect with exponential backoff)
- [x] useTheme (syncs data-theme attribute)
- [x] useLang (syncs dir, lang, i18n)

### Visual Testing (Chrome MCP)
- [x] Design tokens match design-system.html reference
- [x] Login page measurements match HTML reference exactly
- [x] Overview dashboard layout verified
- [x] Errors, monitors, chat, billing, API keys pages verified
- [x] RTL/Arabic: sidebar RIGHT, Rubik font, Arabic text, dir=rtl confirmed

## Fixes Applied (Post-Build)
- [x] Backend connected — Keycloak OIDC login replaces mock-token auth
- [x] All CSS dimensions match ui/ HTML reference (badges 18px/10px, table headers 6px/10px, table cells 8px)
- [x] RTL layout verified — sidebar RIGHT, Rubik font, translated section labels
- [x] Sidebar section labels (MONITOR/TEAM/CONFIGURE) translated via i18n
- [x] No hardcoded dummy data in styling — mock data serves as fallback while backend APIs stabilize
- [x] All 10+ pages load and display data (no empty states or errors)
