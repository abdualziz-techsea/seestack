ALTER TABLE organizations ADD COLUMN allowed_email_domains TEXT[];
ALTER TABLE organizations ADD COLUMN deleted_at TIMESTAMPTZ;
