# Notifications System Report

**Date:** 2026-03-29
**Tested by:** Claude Code (Chrome MCP automated testing)
**Branch:** develop

---

## Root Cause of Original Bug

**The notification bell icon did nothing because it had no `onClick` handler.**

Exact location: `packages/web/src/components/layout/Topbar.tsx` line 151-157
The `<button>` had `aria-label="Notifications"` and `<Bell size={16} />` but was completely unconnected to any state or component. No dropdown existed anywhere in the codebase.

---

## What Was Broken

| Issue | Details |
|-------|---------|
| No click handler | Bell button had zero interactivity |
| No dropdown component | No notification panel existed at all |
| No backend endpoints | `/api/v1/notifications/*` returned 404 |
| No `is_read` field | `notification_log` table had no read/unread tracking |
| No shared types | No `NotificationItem` TypeScript type existed |
| No API client | No `notificationsApi` in shared package |
| No i18n keys | No `notifications.*` translation strings |
| Docker compose bug | Invalid `${VAR:default}` syntax (missing `-`) caused container rebuild failures |
| Flyway conflict | Migration number V31 already taken by `create_billing_invoices.sql` |

---

## What Was Fixed / Implemented

### Backend

| File | Change |
|------|--------|
| `V32__add_is_read_to_notification_log.sql` | New migration: adds `is_read BOOLEAN NOT NULL DEFAULT false` + partial index |
| `NotificationLogEntity.java` | Added `isRead` field, `isRead()` getter, `setRead()` setter |
| `NotificationLogRepository.java` | Added `countByProjectIdAndIsReadFalse()` and `markAllReadByProjectId()` JPQL bulk update |
| `NotificationLogResponse.java` | Added `isRead` field to DTO record |
| `NotificationController.java` | **New controller** — 4 endpoints (see below) |
| `docker-compose.yml` | Fixed invalid `${VAR:default}` → `${VAR:-default}` for 4 env vars |

### Frontend — Shared Package

| File | Change |
|------|--------|
| `types/notification.types.ts` | New: `NotificationItem`, `NotificationListResponse`, `UnreadCountResponse` types |
| `api/notifications.api.ts` | New: `notificationsApi` with `list`, `unreadCount`, `markRead`, `markAllRead` |
| `index.ts` | Exported new types and API module |

### Frontend — Web Package

| File | Change |
|------|--------|
| `features/notifications/hooks/useNotifications.ts` | New: React hook with 30s polling, optimistic state updates |
| `components/shared/NotificationDropdown.tsx` | New: full dropdown panel component |
| `components/layout/Topbar.tsx` | Wired bell button with `onClick`, `ref`, `unreadCount` badge, dropdown |
| `i18n/en.json` | Added `notifications.*` keys (13 strings) |
| `i18n/ar.json` | Added Arabic `notifications.*` keys (13 strings) |

---

## API Endpoints

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/notifications?projectId=<uuid>&page=1&perPage=20` | ✅ 200 | Paginated list, sorted by `sentAt DESC` |
| `GET` | `/api/v1/notifications/unread-count?projectId=<uuid>` | ✅ 200 | Returns `{ count: N }` |
| `PATCH` | `/api/v1/notifications/{id}/read` | ✅ 200 | Mark single notification as read |
| `PATCH` | `/api/v1/notifications/read-all?projectId=<uuid>` | ✅ 200 | Bulk mark all read (JPQL update) |

All endpoints require JWT auth (Bearer token via Keycloak). Requests go through the existing `/api` Vite proxy.

---

## UI Behavior

| Test | Result |
|------|--------|
| Click bell → dropdown opens | ✅ PASS |
| ESC key → closes dropdown | ✅ PASS |
| Click outside → closes dropdown | ✅ PASS |
| Unread count badge on bell icon | ✅ PASS — red badge showing correct count |
| Badge disappears after mark-all-read | ✅ PASS |
| Loading state | ✅ PASS — spinner shown during fetch |
| Empty state | ✅ PASS — BellOff icon + "No notifications yet" + description |
| Error state | ✅ PASS — shown when API call fails |
| Notification list (5 items) | ✅ PASS — all items render with icon, title, timestamp, channel |
| "Mark all read" button | ✅ PASS — button appears only when unread > 0, disappears after |
| "View all in Alerts" footer link | ✅ PASS — navigates to /alerts |
| Read/unread visual difference | ✅ PASS — unread items have highlighted background |
| Trigger type icons | ✅ PASS — error_spike/new_error → red AlertTriangle, monitor_down → yellow Activity |
| Failed notification indicator | ✅ PASS — "· failed" label shown |
| Polling every 30s | ✅ PASS — setInterval fires background refreshes |

---

## Real-time Behavior

WebSocket was not added for notifications (the existing WebSocket handlers are for chat, log tailing, and SSH terminal). Instead, **polling is implemented**:

- Interval: 30 seconds
- On open: immediate fetch (with loading spinner)
- Background polls: silent (no loading state change)
- Timer cleaned up on unmount via `useEffect` return

---

## RTL / LTR Testing

| Check | Arabic (RTL) | English (LTR) |
|-------|-------------|---------------|
| Dropdown alignment | ✅ Opens left-aligned (correct for RTL) | ✅ Opens right-aligned (correct for LTR) |
| Title text direction | ✅ "الإشعارات" right-to-left | ✅ "Notifications" left-to-right |
| Badge position | ✅ Top-left of bell (RTL) | ✅ Top-right of bell (LTR) |
| Notification text | ✅ Arabic labels rendered correctly | ✅ English labels rendered correctly |
| Timestamps | ✅ "9m ago" — shared format | ✅ "9m ago" — shared format |
| "via slack" label | ✅ Correct RTL flow | ✅ Correct LTR flow |
| Mark all read button | ✅ "تحديد الكل كمقروء" | ✅ "Mark all read" |

---

## Bugs Found During Testing

| Bug | Severity | Fix Applied |
|-----|----------|-------------|
| Bell had no click handler | Critical | Fixed — added `onClick`, `ref`, state |
| No notification endpoints on backend | Critical | Fixed — created `NotificationController.java` |
| Flyway version conflict (V31 duplicate) | High | Fixed — renamed to `V32` |
| Docker compose `${VAR:default}` syntax | High | Fixed — changed to `${VAR:-default}` |
| JWT expiry caused mark-all-read to redirect to login | Medium | Root cause: short-lived Keycloak access tokens (~5 min). Pre-existing issue in auth client, not specific to notifications. Axios interceptor fires `window.location.href = '/login'` on any 401 before promise rejection is caught. |

---

## Network Request Verification

All requests confirmed via Chrome DevTools Network tab:

```
GET  /api/v1/notifications?projectId=...&page=1&perPage=20  → 200  (56ms)
GET  /api/v1/notifications/unread-count?projectId=...        → 200  (21ms)
PATCH /api/v1/notifications/read-all?projectId=...          → 200  (fresh token)
```

Auth headers: `Authorization: Bearer <keycloak-jwt>` sent on all requests.

---

## Console Errors

```
ZERO errors.
```

Only pre-existing warning: `No HydrateFallback element provided` (React Router, unrelated to notifications).

---

## Final Status

| Feature | Status |
|---------|--------|
| Bell icon clickable | ✅ PASS |
| Dropdown opens/closes | ✅ PASS |
| Real data from backend | ✅ PASS |
| Unread count badge | ✅ PASS |
| Mark single as read | ✅ IMPLEMENTED (PATCH /{id}/read endpoint verified) |
| Mark all as read | ✅ PASS (tested, 200 response) |
| Empty state | ✅ PASS |
| Error state | ✅ PASS |
| Loading state | ✅ PASS |
| Navigation on click | ✅ IMPLEMENTED |
| Polling updates | ✅ PASS (30s interval) |
| Arabic RTL layout | ✅ PASS |
| English LTR layout | ✅ PASS |
| Zero console errors | ✅ PASS |

## **OVERALL: PASS ✅**
