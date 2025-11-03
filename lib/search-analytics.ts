import { supabase } from './supabase'

export interface SearchAnalytics {
  id: string
  user_id: string
  query: string
  results_count: number
  similarity_threshold: number
  execution_time_ms: number
  clicked_result_ids: string[]
  created_at: string
}

export interface SavedQuery {
  id: string
  user_id: string
  name: string
  query: string
  filters: {
    fileIds?: string[]
    similarityThreshold?: number
    maxResults?: number
  }
  created_at: string
  last_used_at: string
  use_count: number
}

/**
 * Track a search query for analytics
 */
export async function trackSearchQuery(
  userId: string,
  query: string,
  resultsCount: number,
  similarityThreshold: number,
  executionTimeMs: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('search_analytics')
      .insert({
        user_id: userId,
        query: query.trim(),
        results_count: resultsCount,
        similarity_threshold: similarityThreshold,
        execution_time_ms: executionTimeMs,
        clicked_result_ids: []
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error tracking search query:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('Error tracking search query:', error)
    return null
  }
}

/**
 * Track when a user clicks on a search result
 */
export async function trackResultClick(
  searchAnalyticsId: string,
  resultId: string
): Promise<boolean> {
  try {
    // Get current clicked results
    const { data: analytics, error: fetchError } = await supabase
      .from('search_analytics')
      .select('clicked_result_ids')
      .eq('id', searchAnalyticsId)
      .single()

    if (fetchError || !analytics) {
      console.error('Error fetching search analytics:', fetchError)
      return false
    }

    // Add the new result ID if not already present
    const clickedIds = analytics.clicked_result_ids || []
    if (!clickedIds.includes(resultId)) {
      clickedIds.push(resultId)

      const { error: updateError } = await supabase
        .from('search_analytics')
        .update({ clicked_result_ids: clickedIds })
        .eq('id', searchAnalyticsId)

      if (updateError) {
        console.error('Error updating clicked results:', updateError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error tracking result click:', error)
    return false
  }
}

/**
 * Get search history for a user
 */
export async function getSearchHistory(
  userId: string,
  limit: number = 20
): Promise<SearchAnalytics[]> {
  try {
    const { data, error } = await supabase
      .from('search_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching search history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching search history:', error)
    return []
  }
}

/**
 * Get popular search queries
 */
export async function getPopularQueries(
  limit: number = 10,
  daysBack: number = 30
): Promise<Array<{ query: string; count: number; avg_results: number }>> {
  try {
    const { data, error } = await supabase
      .rpc('get_popular_search_queries', {
        days_back: daysBack,
        query_limit: limit
      })

    if (error) {
      console.error('Error fetching popular queries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching popular queries:', error)
    return []
  }
}

/**
 * Save a search query for later use
 */
export async function saveSearchQuery(
  userId: string,
  name: string,
  query: string,
  filters: SavedQuery['filters'] = {}
): Promise<SavedQuery | null> {
  try {
    const { data, error } = await supabase
      .from('saved_queries')
      .insert({
        user_id: userId,
        name: name.trim(),
        query: query.trim(),
        filters,
        use_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving query:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error saving query:', error)
    return null
  }
}

/**
 * Get saved queries for a user
 */
export async function getSavedQueries(userId: string): Promise<SavedQuery[]> {
  try {
    const { data, error } = await supabase
      .from('saved_queries')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved queries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching saved queries:', error)
    return []
  }
}

/**
 * Update saved query usage
 */
export async function updateSavedQueryUsage(queryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_queries')
      .update({
        last_used_at: new Date().toISOString(),
        use_count: supabase.rpc('increment_use_count', { query_id: queryId })
      })
      .eq('id', queryId)

    if (error) {
      console.error('Error updating saved query usage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating saved query usage:', error)
    return false
  }
}

/**
 * Delete a saved query
 */
export async function deleteSavedQuery(queryId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_queries')
      .delete()
      .eq('id', queryId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting saved query:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting saved query:', error)
    return false
  }
}

/**
 * Get search analytics summary for a user
 */
export async function getSearchAnalyticsSummary(
  userId: string,
  daysBack: number = 30
): Promise<{
  totalSearches: number
  avgResultsPerSearch: number
  avgExecutionTime: number
  topQueries: Array<{ query: string; count: number }>
  searchTrends: Array<{ date: string; count: number }>
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_search_analytics', {
        target_user_id: userId,
        days_back: daysBack
      })

    if (error) {
      console.error('Error fetching search analytics summary:', error)
      return {
        totalSearches: 0,
        avgResultsPerSearch: 0,
        avgExecutionTime: 0,
        topQueries: [],
        searchTrends: []
      }
    }

    return data || {
      totalSearches: 0,
      avgResultsPerSearch: 0,
      avgExecutionTime: 0,
      topQueries: [],
      searchTrends: []
    }
  } catch (error) {
    console.error('Error fetching search analytics summary:', error)
    return {
      totalSearches: 0,
      avgResultsPerSearch: 0,
      avgExecutionTime: 0,
      topQueries: [],
      searchTrends: []
    }
  }
}

/**
 * Get search performance metrics
 */
export async function getSearchPerformanceMetrics(): Promise<{
  avgExecutionTime: number
  slowQueries: Array<{ query: string; avg_time: number; count: number }>
  popularResults: Array<{ result_id: string; click_count: number }>
  querySuccessRate: number
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_search_performance_metrics')

    if (error) {
      console.error('Error fetching search performance metrics:', error)
      return {
        avgExecutionTime: 0,
        slowQueries: [],
        popularResults: [],
        querySuccessRate: 0
      }
    }

    return data || {
      avgExecutionTime: 0,
      slowQueries: [],
      popularResults: [],
      querySuccessRate: 0
    }
  } catch (error) {
    console.error('Error fetching search performance metrics:', error)
    return {
      avgExecutionTime: 0,
      slowQueries: [],
      popularResults: [],
      querySuccessRate: 0
    }
  }
}

/**
 * Clean up old search analytics (keep last 90 days)
 */
export async function cleanupOldSearchAnalytics(daysToKeep: number = 90): Promise<boolean> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const { error } = await supabase
      .from('search_analytics')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Error cleaning up old search analytics:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error cleaning up old search analytics:', error)
    return false
  }
}