ALTER TABLE api_keys ADD COLUMN key_prefix VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE api_keys ADD COLUMN environment VARCHAR(20) NOT NULL DEFAULT 'production';
ALTER TABLE api_keys ADD COLUMN created_by UUID REFERENCES users (id);
