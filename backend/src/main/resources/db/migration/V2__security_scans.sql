-- Security scans: stores "Basic Port Exposure Check" results.
-- Kept simple, no ranges, no aggressive scanning.

CREATE TABLE security_scans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  target         VARCHAR(255) NOT NULL,
  resolved_host  VARCHAR(255),
  scanned_ports  TEXT NOT NULL,
  open_ports     TEXT NOT NULL DEFAULT '',
  closed_ports   TEXT NOT NULL DEFAULT '',
  status         VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

CREATE INDEX idx_security_scans_project_id ON security_scans (project_id);
CREATE INDEX idx_security_scans_created_at ON security_scans (created_at DESC);
