CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id   UUID NOT NULL REFERENCES alert_rules (id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  trigger_type    VARCHAR(50) NOT NULL,
  channel_type    VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'sent',
  payload         JSONB,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_log_project ON notification_log (project_id, sent_at DESC);
CREATE INDEX idx_notification_log_rule ON notification_log (alert_rule_id, sent_at DESC);
