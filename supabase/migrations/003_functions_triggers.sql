-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to search documents using vector similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.file_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity,
    document_chunks.metadata
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get task statistics for dashboard
CREATE OR REPLACE FUNCTION get_task_statistics(user_id uuid DEFAULT NULL)
RETURNS TABLE (
  total_tasks bigint,
  pending_tasks bigint,
  in_progress_tasks bigint,
  completed_tasks bigint,
  overdue_tasks bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_tasks,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_tasks,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_tasks,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date < NOW()) AS overdue_tasks
  FROM service_tasks
  WHERE (user_id IS NULL OR assigned_to = user_id OR created_by = user_id);
END;
$$;

-- Function to get user activity metrics
CREATE OR REPLACE FUNCTION get_user_activity_metrics(days_back int DEFAULT 30)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  role text,
  tasks_created bigint,
  tasks_completed bigint,
  files_uploaded bigint,
  ai_interactions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
    p.role,
    COALESCE(tc.tasks_created, 0) AS tasks_created,
    COALESCE(tcomp.tasks_completed, 0) AS tasks_completed,
    COALESCE(fu.files_uploaded, 0) AS files_uploaded,
    COALESCE(ai.ai_interactions, 0) AS ai_interactions
  FROM profiles p
  LEFT JOIN (
    SELECT created_by, COUNT(*) AS tasks_created
    FROM service_tasks
    WHERE created_at >= NOW() - INTERVAL '%s days'
    GROUP BY created_by
  ) tc ON p.id = tc.created_by
  LEFT JOIN (
    SELECT assigned_to, COUNT(*) AS tasks_completed
    FROM service_tasks
    WHERE status = 'completed' AND updated_at >= NOW() - INTERVAL '%s days'
    GROUP BY assigned_to
  ) tcomp ON p.id = tcomp.assigned_to
  LEFT JOIN (
    SELECT uploaded_by, COUNT(*) AS files_uploaded
    FROM files
    WHERE created_at >= NOW() - INTERVAL '%s days'
    GROUP BY uploaded_by
  ) fu ON p.id = fu.uploaded_by
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS ai_interactions
    FROM ai_interactions
    WHERE created_at >= NOW() - INTERVAL '%s days'
    GROUP BY user_id
  ) ai ON p.id = ai.user_id
  WHERE p.status = 'active';
END;
$$;

-- Function to automatically update task status based on completion
CREATE OR REPLACE FUNCTION auto_update_task_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If all required fields are filled and task was pending, move to in_progress
  IF OLD.status = 'pending' AND NEW.assigned_to IS NOT NULL THEN
    NEW.status = 'in_progress';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic task status updates
CREATE TRIGGER trigger_auto_update_task_status
  BEFORE UPDATE ON service_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_task_status();

-- Function to clean up old AI interactions (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_ai_interactions()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_interactions
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM ai_interactions
    ) ranked
    WHERE rn <= 100
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get file storage statistics
CREATE OR REPLACE FUNCTION get_storage_statistics()
RETURNS TABLE (
  total_files bigint,
  total_size_bytes bigint,
  processed_files bigint,
  unprocessed_files bigint,
  avg_file_size_mb numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_files,
    COALESCE(SUM(file_size), 0) AS total_size_bytes,
    COUNT(*) FILTER (WHERE is_processed = true) AS processed_files,
    COUNT(*) FILTER (WHERE is_processed = false) AS unprocessed_files,
    ROUND(COALESCE(AVG(file_size), 0) / 1024.0 / 1024.0, 2) AS avg_file_size_mb
  FROM files;
END;
$$;