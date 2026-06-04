CREATE TABLE IF NOT EXISTS facodi.analysis_job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES facodi.analysis_jobs(id) ON DELETE CASCADE,
  requested_by UUID,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'pipeline_started',
      'pipeline_succeeded',
      'pipeline_failed',
      'stage_started',
      'stage_succeeded',
      'stage_failed',
      'retry_scheduled'
    )
  ),
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('queued', 'running', 'succeeded', 'failed', 'needs_review', 'cancelled', 'retrying')
  ),
  attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt > 0),
  request_id UUID NOT NULL,
  error_code TEXT,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facodi_job_events_job_created
  ON facodi.analysis_job_events(job_id, created_at);

CREATE INDEX IF NOT EXISTS idx_facodi_job_events_requested_by
  ON facodi.analysis_job_events(requested_by, created_at DESC);

ALTER TABLE facodi.analysis_job_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON facodi.analysis_job_events TO authenticated;
GRANT ALL ON facodi.analysis_job_events TO service_role;

DROP POLICY IF EXISTS user_read_own_analysis_job_events ON facodi.analysis_job_events;
CREATE POLICY user_read_own_analysis_job_events ON facodi.analysis_job_events
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

DROP POLICY IF EXISTS editor_read_analysis_job_events ON facodi.analysis_job_events;
CREATE POLICY editor_read_analysis_job_events ON facodi.analysis_job_events
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));
