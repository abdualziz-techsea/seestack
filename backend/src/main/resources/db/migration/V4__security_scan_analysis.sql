-- Extend security scans with lightweight intelligent analysis output
-- and add a per-fingerprint AI-analysis cache.

ALTER TABLE security_scans
  ADD COLUMN detected_services   TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN http_info           TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN security_headers    TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN risk_score          INT  NOT NULL DEFAULT 0,
  ADD COLUMN risk_level          VARCHAR(20) NOT NULL DEFAULT 'LOW',
  ADD COLUMN summary             TEXT;

-- AI analysis cache (per project_id + fingerprint).
CREATE TABLE ai_error_analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fingerprint   VARCHAR(64) NOT NULL,
  payload       TEXT NOT NULL,
  model         VARCHAR(100),
  occurrences_at_generation BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, fingerprint)
);

CREATE INDEX idx_ai_error_analyses_project_fp
  ON ai_error_analyses (project_id, fingerprint);
