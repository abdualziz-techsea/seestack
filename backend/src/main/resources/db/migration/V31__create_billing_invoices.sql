CREATE TABLE billing_invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  moyasar_id       VARCHAR(255) NOT NULL UNIQUE,
  plan             VARCHAR(50) NOT NULL,
  amount_halalas   INTEGER NOT NULL,
  currency         VARCHAR(10) NOT NULL DEFAULT 'SAR',
  status           VARCHAR(50) NOT NULL DEFAULT 'initiated',
  checkout_url     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_invoices_org_id ON billing_invoices (org_id, created_at DESC);
CREATE INDEX idx_billing_invoices_moyasar_id ON billing_invoices (moyasar_id);
