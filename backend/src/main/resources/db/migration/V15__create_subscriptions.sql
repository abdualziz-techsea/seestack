CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  plan                   VARCHAR(50) NOT NULL DEFAULT 'free',
  status                 VARCHAR(50) NOT NULL DEFAULT 'active',
  moyasar_invoice_id     VARCHAR(255),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org_id ON subscriptions (org_id);
