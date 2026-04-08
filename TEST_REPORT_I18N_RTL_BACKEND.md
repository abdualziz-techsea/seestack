# i18n / RTL / Backend Integration Test Report — SeeStack Frontend

**Date:** 2026-03-29
**Tester:** Claude Code (automated via Chrome MCP)
**Branch:** develop
**Languages tested:** English (LTR) · Arabic (RTL)
**Backend:** Docker container `seestack-backend` (Spring Boot 3.x)
**Frontend:** Vite dev server `http://localhost:3001`

---

## Summary

All 5 target pages/components are now fully translated (EN + AR), RTL-correct, and wired to real backend data. Every fix was confirmed with live browser evidence.

| Component | LTR ✓ | RTL ✓ | Backend ✓ | Issues Fixed |
|-----------|--------|--------|-----------|--------------|
| `/flags` | ✅ | ✅ | ✅ | 6 |
| `/billing` | ✅ | ✅ | ✅ (existing) | 4 |
| `/settings/general` | ✅ | ✅ | ✅ | 3 |
| `/settings/api-keys` | ✅ | ✅ | ✅ | 5 |
| Topbar profile menu | ✅ | ✅ | — | 2 |

---

## Issues Found & Fixed

### 1. `/flags` — No Translation Keys (entire `flags` section missing)

**Symptom:** All flags page strings showed English regardless of language — `t('flags.title', { defaultValue: 'Feature Flags' })` always fell back to the defaultValue.

**Root cause:** The `flags` section did not exist in `en.json` or `ar.json`. Same for `empty.noFlags`.

**Fix:** Added complete `flags` section to both files:
```json
"flags": {
  "title": "Feature Flags",
  "createFlag": "Create flag",
  "key": "Key",
  "name": "Name",
  "rollout": "Rollout %",
  "keyCol": "Key",
  "nameCol": "Name",
  "rolloutCol": "Rollout",
  "updatedCol": "Updated"
}
```
Arabic equivalents added. Also removed all `{ defaultValue: '...' }` fallbacks from `FlagsPage.tsx` so missing keys fail visibly.

**Evidence:** RTL snapshot shows "أعلام الميزات" / "إنشاء علم" / "المفتاح" / "الاسم" / "نسبة الطرح" / "آخر تحديث".

---

### 2. `/flags` — DIY Toggle Broken in RTL

**Symptom:** The feature flag toggle used `translateX(18px)` / `translateX(2px)` inline styles. In RTL, `position: absolute` without explicit `left/right` anchors to the container's end (right), so `translateX` moved the thumb off-screen.

**Root cause:** CSS `translateX` is always physical (positive = rightward), not logical. DIY toggles using it do not auto-reverse in RTL.

**Fix:** Created `packages/web/src/components/shared/Toggle.tsx` using CSS logical property `insetInlineStart`:
```tsx
<div
  className="absolute top-[2px] rounded-full bg-white transition-all"
  style={{
    width: thumbSize,
    height: thumbSize,
    insetInlineStart: checked ? checkedOffset : pad,
  }}
/>
```
`insetInlineStart` maps to `left` in LTR and `right` in RTL, so the thumb always moves from start→end as the toggle turns ON.

Same fix applied to the billing Monthly/Annual toggle.

**Evidence (measured):**
- RTL OFF: `thumbFromLeft: 18, thumbFromRight: 2` → thumb 2px from right edge (start in RTL) ✓
- RTL ON: `thumbFromLeft: 2, thumbFromRight: 18, bg: rgb(26,155,108)` → thumb 2px from left edge (end in RTL), primary green background ✓
- Network: PATCH `/api/v1/flags/dark-mode-v2/toggle?projectId=...` [**200**] on click

---

### 3. `/flags` — `isActive` Field Mismatch

**Symptom:** After the `isActive` fix, `aria-checked` was absent from the toggle. Toggle showed visually as always OFF regardless of backend state.

**Root cause:** The backend serializes `boolean isActive` via Jackson getter `isActive()` → JSON field `isActive`. The frontend `FeatureFlag` interface declared `active: boolean`. Because `f.active` was `undefined`, `aria-checked={undefined}` removes the attribute entirely.

**Fix:** Added normalization in `useFeatureFlags.ts`:
```ts
const items = Array.isArray(raw)
  ? raw.map((f: any) => ({ ...f, active: f.active ?? f.isActive ?? false }))
  : []
```

**Evidence:** After fix: `aria-checked="false"` (OFF) and `aria-checked="true"` (ON) both correct.

---

### 4. Topbar Profile Menu — "Profile" Hardcoded + Settings Click Dead

**Symptom (1):** "Profile" button showed hardcoded English `Profile` with no `onClick`. In Arabic mode it still showed "Profile".

**Symptom (2):** "Settings" button in user menu had no `onClick` handler — click closed the menu and did nothing.

**Root cause:** Both buttons lacked event handlers. `nav.profile` key was missing from both i18n files.

**Fix 1:** Added `nav.profile` to `en.json` / `ar.json`.

**Fix 2:** Added `onClick` to both Profile and Settings buttons in `Topbar.tsx`:
```tsx
onClick={() => { setUserMenuOpen(false); navigate('/settings/general') }}
```

**Evidence:** In RTL — user menu shows "الملف الشخصي" / "الإعدادات" / "تسجيل الخروج". Clicking "الإعدادات" navigates to `/settings/general` and renders the page.

---

### 5. `/billing` — All Strings Hardcoded English

**Symptom:** "Monthly", "Annual", "Save 20%", "Your plan", "Current", all 4 usage bar labels, and all plan feature lists showed English in Arabic mode.

**Root cause:** All these strings were hardcoded literals inside the component, not using `t()`. `planFeatures` was a static JS object of English strings.

**Fix 1:** Added missing billing keys to both i18n files:
- `billing.monthly`, `billing.annual`, `billing.savePercent`, `billing.yourPlan`, `billing.current`
- `billing.usageErrors`, `billing.usageMonitors`, `billing.usageSSH`, `billing.usageMembers`
- `billing.features.{plan}` as translatable arrays (4 plans × 4-5 items)

**Fix 2:** Replaced all hardcoded strings in `BillingPage.tsx`:
```tsx
// Usage bars — now from i18n
{ label: t('billing.usageErrors'), ... }

// Plan features — now from i18n returnObjects
{(t(`billing.features.${plan}`, { returnObjects: true }) as string[]).map(...)}

// Labels
t('billing.monthly') / t('billing.annual') / t('billing.savePercent')
t('billing.yourPlan') / t('billing.current')
```

**Fix 3:** Replaced DIY billing toggle with `Toggle` component (RTL-aware).

**Evidence (Arabic):** "شهري" / "سنوي" / "وفر 20%" toggle rendered. "خطتك" badge on Free plan. "الحالية" on Free button. All plan features in Arabic: "مشروع واحد", "مشاريع غير محدودة", etc.

---

### 6. `/settings/api-keys` — Entirely Fake Backend Integration

**Symptom (1):** Create key: `onClick={() => setNewKey('ask_live_' + Math.random()...)}` — generated a fake random key locally, never called backend.

**Symptom (2):** Revoke button: `onClick={() => setShowRevoke(null)}` — only closed the dialog, no DELETE request.

**Symptom (3):** Wrong endpoint: `GET /api/v1/settings/api-keys` (404). Correct: `GET /api/v1/projects/{projectId}/api-keys`.

**Symptom (4):** Form inputs `name` and `environment` had no state bindings — values were never read on submit.

**Symptom (5):** Field mapping: used `key.prefix` and `key.environment` which don't exist in `ApiKeyResponse`. Backend returns `keyPrefix` and `lastUsedAt` (no environment field).

**Fix 1:** Rewrote `useApiKeys.ts` with correct endpoint and two new mutations:
```ts
// List
GET /api/v1/projects/${currentProject.id}/api-keys

// Create
POST /api/v1/projects/${currentProject.id}/api-keys  { name }

// Revoke
DELETE /api/v1/projects/${currentProject.id}/api-keys/${keyId}
```

**Fix 2:** Rewrote `ApiKeysPage.tsx` with controlled `keyName` state, real `handleCreate` / `handleRevoke` functions wired to mutations, correct field mapping (`key.keyPrefix`, `key.lastUsedAt`).

**Fix 3:** Added full `apiKeys` i18n section to both files (create dialog, reveal dialog, revoke dialog, table headers, security note).

**Evidence:**
- GET `/api/v1/projects/{projectId}/api-keys` [**200**] — 3 real keys loaded
- POST `/api/v1/projects/{projectId}/api-keys` [**201**] — key `ask_6628edce00ab4edb958b05d3175934f1` returned and displayed in reveal dialog
- DELETE `/api/v1/projects/{projectId}/api-keys/{keyId}` [**204**] — key removed from table immediately

---

### 7. `/settings/general` — Fake Save + Hardcoded Org Data

**Symptom (1):** Save handler: `await new Promise((r) => setTimeout(r, 1000))` — fake delay, never called backend.

**Symptom (2):** Initial values hardcoded: `{ name: 'My Organization', slug: 'my-org' }` — not real org data.

**Symptom (3):** Wrong endpoint in `useOrgSettings`: `GET /api/v1/settings/organization?orgId=...` (404). Correct: `GET /api/v1/organizations/{orgId}`.

**Symptom (4):** Wrong endpoint in `useUpdateSettings`: `PUT /api/v1/settings/organization` (404). Correct: `PUT /api/v1/organizations/{orgId}`.

**Symptom (5):** "Download all your data as JSON" and "Permanently delete this workspace and all data" hardcoded in English.

**Fix 1:** `useOrgSettings.ts` — corrected URL:
```ts
apiClient.get(`/api/v1/organizations/${org!.id}`)
```

**Fix 2:** `useUpdateSettings.ts` — corrected URL:
```ts
apiClient.put(`/api/v1/organizations/${org!.id}`, data)
```

**Fix 3:** Rewrote `GeneralSettingsPage.tsx`:
- Uses `useOrgSettings()` with `enableReinitialize` for real initial values
- `handleSave` calls `update({ name, slug })` via mutation
- `orgSlug` derived from `settings?.slug` (real value for delete confirmation)

**Fix 4:** Added `settings.exportDesc`, `settings.exportAction`, `settings.deleteDesc`, `settings.deleteDialogDesc` to both i18n files.

**Evidence:**
- GET `/api/v1/organizations/{orgId}` [**200**] — form pre-filled with `DevCompany` / `devcompany`
- PUT `/api/v1/organizations/{orgId}` [**200**] — save confirmed on button click
- Arabic: "اسم مساحة العمل", "رابط مساحة العمل", "تحميل جميع بياناتك بصيغة JSON", "حذف مساحة العمل وجميع البيانات نهائياً"

---

## Files Changed

| File | Change |
|------|--------|
| `packages/web/src/i18n/en.json` | Added `nav.profile`, `flags.*`, `empty.noFlags`, `billing.monthly/annual/savePercent/yourPlan/current/usageErrors/usageMonitors/usageSSH/usageMembers/features.*`, `apiKeys.*`, `settings.exportDesc/exportAction/deleteDesc/deleteDialogDesc` |
| `packages/web/src/i18n/ar.json` | Same additions in Arabic |
| `packages/web/src/components/shared/Toggle.tsx` | **New** — RTL-aware toggle using `insetInlineStart` |
| `packages/web/src/features/flags/hooks/useFeatureFlags.ts` | Normalize `isActive→active` in list query |
| `packages/web/src/features/flags/pages/FlagsPage.tsx` | Import `Toggle`, use i18n keys (no more defaultValue fallbacks), replace DIY toggle with `Toggle` |
| `packages/web/src/components/layout/Topbar.tsx` | `t('nav.profile')` for Profile button; `onClick→navigate('/settings/general')` for both Profile and Settings |
| `packages/web/src/features/billing/pages/BillingPage.tsx` | Translate all hardcoded strings; `t(…, { returnObjects: true })` for plan features; replace DIY toggle with `Toggle` |
| `packages/web/src/features/settings/hooks/useApiKeys.ts` | Fix endpoint to `/api/v1/projects/{id}/api-keys`; add `useCreateApiKey`, `useRevokeApiKey` mutations |
| `packages/web/src/features/settings/pages/ApiKeysPage.tsx` | Full rewrite: controlled form state, real create/revoke mutations, correct field mapping, full i18n |
| `packages/web/src/features/settings/hooks/useOrgSettings.ts` | Fix endpoint to `GET /api/v1/organizations/{orgId}` |
| `packages/web/src/features/settings/hooks/useUpdateSettings.ts` | Fix endpoint to `PUT /api/v1/organizations/{orgId}` |
| `packages/web/src/features/settings/pages/GeneralSettingsPage.tsx` | Use `useOrgSettings` + `useUpdateSettings`; `enableReinitialize`; translate danger zone strings |

---

## Network Evidence Summary

| Request | Status | Page | Confirms |
|---------|--------|------|---------|
| GET `/api/v1/flags?projectId=...` | 200 | /flags | Real flag list loaded |
| PATCH `/api/v1/flags/dark-mode-v2/toggle?projectId=...` | 200 | /flags | Toggle fires correctly |
| GET `/api/v1/organizations/{orgId}` | 200 | /settings/general | Real org data loaded |
| PUT `/api/v1/organizations/{orgId}` | 200 | /settings/general | Real save confirmed |
| GET `/api/v1/projects/{projectId}/api-keys` | 200 | /settings/api-keys | Real keys list loaded |
| POST `/api/v1/projects/{projectId}/api-keys` | 201 | /settings/api-keys | Real key created, raw key returned |
| DELETE `/api/v1/projects/{projectId}/api-keys/{keyId}` | 204 | /settings/api-keys | Real revoke confirmed |

---

## RTL Toggle Correctness

The new `Toggle` component passes the following positional checks (36px wide, 16px thumb, 2px pad):

| State | Direction | thumbFromLeft | thumbFromRight | Expected |
|-------|-----------|--------------|----------------|----------|
| OFF | RTL | 18px | **2px** | 2px from start (right) ✓ |
| ON | RTL | **2px** | 18px | 2px from end (left) ✓ |
| OFF | LTR | **2px** | 18px | 2px from start (left) ✓ |
| ON | LTR | 18px | **2px** | 2px from end (right) ✓ |

---

## Known Non-Issues

- **`keyPrefix` shows `••••••••`:** `ApiKeyResponse` omits `keyPrefix` from the list endpoint (only returned on creation for security). This is correct — the raw prefix is not stored or re-served.
- **No `environment` field on API keys:** Backend `ApiKeyResponse` has no environment. The column was removed from the table.
- **Double `GET /api/v1/organizations`:** `useAuth()` fetches orgs directly + TanStack Query fetches separately. Functionally harmless (both cached). Pre-existing issue documented in TEST_REPORT_INTEGRATION.md.
