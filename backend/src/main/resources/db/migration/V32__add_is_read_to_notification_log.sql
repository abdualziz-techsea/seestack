ALTER TABLE notification_log
    ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_notification_log_unread ON notification_log (project_id, is_read)
    WHERE is_read = false;
