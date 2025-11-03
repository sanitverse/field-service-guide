-- Create search analytics table
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  similarity_threshold FLOAT DEFAULT 0.78,
  execution_time_ms INTEGER DEFAULT 0,
  clicked_result_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved queries table
CREATE TABLE saved_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_created_at ON search_analytics(created_at);
CREATE INDEX idx_search_analytics_query ON search_analytics(query);
CREATE INDEX idx_saved_queries_user_id ON saved_queries(user_id);
CREATE INDEX idx_saved_queries_last_used ON saved_queries(last_used_at);

-- Function to get popular search queries
CREATE OR REPLACE FUNCTION get_popular_search_queries(
  days_back int DEFAULT 30,
  query_limit int DEFAULT 10
)
RETURNS TABLE (
  query text,
  count bigint,
  avg_results numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.query,
    COUNT(*) as count,
    ROUND(AVG(sa.results_count), 2) as avg_results
  FROM search_analytics sa
  WHERE sa.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY sa.query
  HAVING COUNT(*) > 1
  ORDER BY count DESC, avg_results DESC
  LIMIT query_limit;
END;
$$;

-- Function to get user search analytics
CREATE OR REPLACE FUNCTION get_user_search_analytics(
  target_user_id uuid,
  days_back int DEFAULT 30
)
RETURNS TABLE (
  total_searches bigint,
  avg_results_per_search numeric,
  avg_execution_time numeric,
  top_queries jsonb,
  search_trends jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_record RECORD;
BEGIN
  -- Get basic stats
  SELECT
    COUNT(*) as total,
    ROUND(AVG(results_count), 2) as avg_results,
    ROUND(AVG(execution_time_ms), 2) as avg_time
  INTO result_record
  FROM search_analytics
  WHERE user_id = target_user_id
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL;

  -- Get top queries
  WITH top_queries_cte AS (
    SELECT
      query,
      COUNT(*) as count
    FROM search_analytics
    WHERE user_id = target_user_id
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY query
    ORDER BY count DESC
    LIMIT 5
  ),
  -- Get search trends by day
  search_trends_cte AS (
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM search_analytics
    WHERE user_id = target_user_id
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date
  )
  SELECT
    COALESCE(result_record.total, 0) as total_searches,
    COALESCE(result_record.avg_results, 0) as avg_results_per_search,
    COALESCE(result_record.avg_time, 0) as avg_execution_time,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('query', query, 'count', count))
       FROM top_queries_cte), 
      '[]'::jsonb
    ) as top_queries,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('date', date, 'count', count))
       FROM search_trends_cte), 
      '[]'::jsonb
    ) as search_trends
  INTO total_searches, avg_results_per_search, avg_execution_time, top_queries, search_trends;

  RETURN NEXT;
END;
$$;

-- Function to get search performance metrics
CREATE OR REPLACE FUNCTION get_search_performance_metrics()
RETURNS TABLE (
  avg_execution_time numeric,
  slow_queries jsonb,
  popular_results jsonb,
  query_success_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_time numeric;
  success_rate numeric;
BEGIN
  -- Get average execution time
  SELECT ROUND(AVG(execution_time_ms), 2)
  INTO avg_time
  FROM search_analytics
  WHERE created_at >= NOW() - INTERVAL '30 days';

  -- Calculate success rate (queries with results > 0)
  SELECT 
    ROUND(
      (COUNT(*) FILTER (WHERE results_count > 0)::numeric / COUNT(*)::numeric) * 100, 
      2
    )
  INTO success_rate
  FROM search_analytics
  WHERE created_at >= NOW() - INTERVAL '30 days';

  -- Get slow queries
  WITH slow_queries_cte AS (
    SELECT
      query,
      ROUND(AVG(execution_time_ms), 2) as avg_time,
      COUNT(*) as count
    FROM search_analytics
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND execution_time_ms > 1000  -- Queries taking more than 1 second
    GROUP BY query
    ORDER BY avg_time DESC
    LIMIT 10
  ),
  -- Get popular results (most clicked)
  popular_results_cte AS (
    SELECT
      unnest(clicked_result_ids) as result_id,
      COUNT(*) as click_count
    FROM search_analytics
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND array_length(clicked_result_ids, 1) > 0
    GROUP BY unnest(clicked_result_ids)
    ORDER BY click_count DESC
    LIMIT 10
  )
  SELECT
    COALESCE(avg_time, 0) as avg_execution_time,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('query', query, 'avg_time', avg_time, 'count', count))
       FROM slow_queries_cte), 
      '[]'::jsonb
    ) as slow_queries,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('result_id', result_id, 'click_count', click_count))
       FROM popular_results_cte), 
      '[]'::jsonb
    ) as popular_results,
    COALESCE(success_rate, 0) as query_success_rate
  INTO avg_execution_time, slow_queries, popular_results, query_success_rate;

  RETURN NEXT;
END;
$$;

-- Function to increment use count for saved queries
CREATE OR REPLACE FUNCTION increment_use_count(query_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT use_count INTO current_count
  FROM saved_queries
  WHERE id = query_id;
  
  RETURN COALESCE(current_count, 0) + 1;
END;
$$;