# Phase 10 — Billing (Moyasar)

Status: Done
Branch: feature/billing-phase10
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] V15: subscriptions table
- [x] V16: billing_events table
- [x] PlanLimits enum (FREE/STARTER/PRO/SCALE)
- [x] PlanEnforcementService — org limit checks
- [x] MoyasarInvoiceService scaffold (mock checkout URL)
- [x] BillingService — subscription lifecycle
- [x] POST /api/v1/billing/upgrade (scaffold)
- [x] POST /webhooks/moyasar (public webhook)
- [x] GET /api/v1/billing/subscription
- [x] PlanLimitsTest (3 tests)

## Testing

- Get subscription (free plan, correct limits): PASS
- Initiate upgrade (mock checkout URL returned): PASS
- Moyasar webhook (public, no JWT): PASS
- Regression: PASS
