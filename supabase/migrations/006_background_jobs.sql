-- Create background jobs table for file processing queue
CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('file_processing')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  result JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_type ON background_jobs(type);
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_at ON background_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_background_jobs_payload_file_id ON background_jobs USING GIN ((payload->>'fileId'));

-- RLS policies for background jobs
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins and supervisors can view job status
CREATE POLICY "Admins and supervisors can view jobs" ON background_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Only system can insert/update jobs (no user access)
CREATE POLICY "System only job management" ON background_jobs
  FOR ALL USING (false);

-- Function to get job statistics
CREATE OR REPLACE FUNCTION get_job_statistics()
RETURNS TABLE (
  pending_jobs BIGINT,
  processing_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  total_jobs BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
    COUNT(*) as total_jobs
  FROM background_jobs;
END;
$$;