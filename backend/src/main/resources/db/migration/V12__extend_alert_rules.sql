-- Extend alert_rules with Phase 8 columns
ALTER TABLE alert_rules ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Rule';
ALTER TABLE alert_rules RENAME COLUMN type TO trigger_type;
ALTER TABLE alert_rules RENAME COLUMN config TO trigger_config;
ALTER TABLE alert_rules RENAME COLUMN is_active TO is_enabled;
ALTER TABLE alert_rules ADD COLUMN severity_filter VARCHAR(20) NOT NULL DEFAULT 'all';
ALTER TABLE alert_rules ADD COLUMN quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE alert_rules ADD COLUMN quiet_start TIME NOT NULL DEFAULT '23:00';
ALTER TABLE alert_rules ADD COLUMN quiet_end TIME NOT NULL DEFAULT '08:00';
ALTER TABLE alert_rules ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX idx_alert_rules_trigger_type ON alert_rules (trigger_type);
CREATE INDEX idx_alert_rules_enabled ON alert_rules (project_id, is_enabled);
