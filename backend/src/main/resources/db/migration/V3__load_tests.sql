-- Basic Load Test results.
-- Limits: max 100 requests, max 10 concurrency, 5s per-request timeout,
-- 60s cooldown per target. Targets must be existing monitor URLs.

CREATE TABLE load_tests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  monitor_id               UUID REFERENCES monitor_configs(id) ON DELETE SET NULL,
  target_url               TEXT NOT NULL,
  requested_count          INT  NOT NULL,
  concurrency              INT  NOT NULL,
  status                   VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_requests           INT NOT NULL DEFAULT 0,
  successful_requests      INT NOT NULL DEFAULT 0,
  failed_requests          INT NOT NULL DEFAULT 0,
  avg_response_time_ms     DOUBLE PRECISION NOT NULL DEFAULT 0,
  min_response_time_ms     INT NOT NULL DEFAULT 0,
  max_response_time_ms     INT NOT NULL DEFAULT 0,
  p95_response_time_ms     INT NOT NULL DEFAULT 0,
  status_code_distribution TEXT NOT NULL DEFAULT '{}',
  error_message            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ
);

CREATE INDEX idx_load_tests_project_id ON load_tests (project_id);
CREATE INDEX idx_load_tests_created_at ON load_tests (created_at DESC);
