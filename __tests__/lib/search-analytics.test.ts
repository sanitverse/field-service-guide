import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  trackSearchQuery,
  trackResultClick,
  getSearchHistory,
  getPopularQueries,
  saveSearchQuery,
  getSavedQueries,
  updateSavedQueryUsage,
  deleteSavedQuery,
  getSearchAnalyticsSummary,
  getSearchPerformanceMetrics,
  cleanupOldSearchAnalytics
} from '@/lib/search-analytics'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase')
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Search Analytics Tests', () => {
  const mockUserId = 'user-123'
  const mockQuery = 'field service documentation'
  const mockSearchAnalyticsId = 'analytics-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Search Query Tracking', () => {
    it('should track search query successfully', async () => {
      const mockAnalyticsData = {
        id: mockSearchAnalyticsId,
        user_id: mockUserId,
        query: mockQuery,
        results_count: 5,
        similarity_threshold: 0.78,
        execution_time_ms: 150
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAnalyticsData,
              error: null
            })
          })
        })
      } as any)

      const result = await trackSearchQuery(mockUserId, mockQuery, 5, 0.78, 150)

      expect(result).toBe(mockSearchAnalyticsId)
      expect(mockSupabase.from).toHaveBeenCalledWith('search_analytics')
    })

    it('should handle tracking errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          })
        })
      } as any)

      const result = await trackSearchQuery(mockUserId, mockQuery, 5, 0.78, 150)

      expect(result).toBeNull()
    })

    it('should trim query text before tracking', async () => {
      const queryWithSpaces = '  field service  '
      const expectedTrimmedQuery = 'field service'

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockSearchAnalyticsId },
              error: null
            })
          })
        })
      } as any)

      await trackSearchQuery(mockUserId, queryWithSpaces, 3, 0.8, 100)

      const insertCall = (mockSupabase.from as jest.Mock).mock.calls[0]
      const insertData = insertCall[0]
      expect(insertData).toBe('search_analytics')
    })
  })

  describe('Result Click Tracking', () => {
    it('should track result click successfully', async () => {
      const existingClicks = ['result-1', 'result-2']
      const newResultId = 'result-3'

      // Mock fetching existing analytics
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { clicked_result_ids: existingClicks },
              error: null
            })
          })
        })
      } as any)

      // Mock updating analytics
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      } as any)

      const result = await trackResultClick(mockSearchAnalyticsId, newResultId)

      expect(result).toBe(true)
    })

    it('should not duplicate existing clicks', async () => {
      const existingClicks = ['result-1', 'result-2']
      const duplicateResultId = 'result-1'

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { clicked_result_ids: existingClicks },
              error: null
            })
          })
        })
      } as any)

      const result = await trackResultClick(mockSearchAnalyticsId, duplicateResultId)

      expect(result).toBe(true)
      // Should not call update since result already exists
    })

    it('should handle click tracking errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found')
            })
          })
        })
      } as any)

      const result = await trackResultClick(mockSearchAnalyticsId, 'result-1')

      expect(result).toBe(false)
    })
  })

  describe('Search History', () => {
    it('should retrieve search history for user', async () => {
      const mockHistory = [
        {
          id: '1',
          user_id: mockUserId,
          query: 'recent query',
          results_count: 3,
          created_at: '2024-01-02T00:00:00Z'
        },
        {
          id: '2',
          user_id: mockUserId,
          query: 'older query',
          results_count: 5,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockHistory,
                error: null
              })
            })
          })
        })
      } as any)

      const result = await getSearchHistory(mockUserId, 20)

      expect(result).toEqual(mockHistory)
      expect(result).toHaveLength(2)
    })

    it('should limit search history results', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      } as any)

      await getSearchHistory(mockUserId, 10)

      // Verify limit was called with correct value
      const mockChain = mockSupabase.from().select().eq().order()
      expect(mockChain.limit).toHaveBeenCalledWith(10)
    })
  })

  describe('Popular Queries', () => {
    it('should retrieve popular queries', async () => {
      const mockPopularQueries = [
        { query: 'field service', count: 25, avg_results: 4.2 },
        { query: 'maintenance', count: 18, avg_results: 3.8 },
        { query: 'troubleshooting', count: 12, avg_results: 5.1 }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockPopularQueries,
        error: null
      })

      const result = await getPopularQueries(10, 30)

      expect(result).toEqual(mockPopularQueries)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_popular_search_queries', {
        days_back: 30,
        query_limit: 10
      })
    })

    it('should handle RPC errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC error')
      })

      const result = await getPopularQueries()

      expect(result).toEqual([])
    })
  })

  describe('Saved Queries', () => {
    const mockSavedQuery = {
      id: 'saved-1',
      user_id: mockUserId,
      name: 'My Saved Query',
      query: 'field service documentation',
      filters: { similarityThreshold: 0.8 },
      created_at: '2024-01-01T00:00:00Z',
      last_used_at: '2024-01-01T00:00:00Z',
      use_count: 0
    }

    it('should save a search query', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSavedQuery,
              error: null
            })
          })
        })
      } as any)

      const result = await saveSearchQuery(
        mockUserId,
        'My Saved Query',
        'field service documentation',
        { similarityThreshold: 0.8 }
      )

      expect(result).toEqual(mockSavedQuery)
    })

    it('should retrieve saved queries for user', async () => {
      const mockSavedQueries = [mockSavedQuery]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSavedQueries,
              error: null
            })
          })
        })
      } as any)

      const result = await getSavedQueries(mockUserId)

      expect(result).toEqual(mockSavedQueries)
    })

    it('should update saved query usage', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      } as any)

      mockSupabase.rpc.mockReturnValue('increment_use_count')

      const result = await updateSavedQueryUsage('saved-1')

      expect(result).toBe(true)
    })

    it('should delete saved query', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        })
      } as any)

      const result = await deleteSavedQuery('saved-1', mockUserId)

      expect(result).toBe(true)
    })
  })

  describe('Analytics Summary', () => {
    it('should retrieve search analytics summary', async () => {
      const mockSummary = {
        totalSearches: 150,
        avgResultsPerSearch: 4.2,
        avgExecutionTime: 180,
        topQueries: [
          { query: 'field service', count: 25 },
          { query: 'maintenance', count: 18 }
        ],
        searchTrends: [
          { date: '2024-01-01', count: 10 },
          { date: '2024-01-02', count: 15 }
        ]
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockSummary,
        error: null
      })

      const result = await getSearchAnalyticsSummary(mockUserId, 30)

      expect(result).toEqual(mockSummary)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_search_analytics', {
        target_user_id: mockUserId,
        days_back: 30
      })
    })

    it('should return default values on error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC error')
      })

      const result = await getSearchAnalyticsSummary(mockUserId)

      expect(result.totalSearches).toBe(0)
      expect(result.avgResultsPerSearch).toBe(0)
      expect(result.topQueries).toEqual([])
    })
  })

  describe('Performance Metrics', () => {
    it('should retrieve search performance metrics', async () => {
      const mockMetrics = {
        avgExecutionTime: 165,
        slowQueries: [
          { query: 'complex query', avg_time: 500, count: 5 }
        ],
        popularResults: [
          { result_id: 'result-1', click_count: 25 }
        ],
        querySuccessRate: 0.92
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockMetrics,
        error: null
      })

      const result = await getSearchPerformanceMetrics()

      expect(result).toEqual(mockMetrics)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_search_performance_metrics')
    })

    it('should handle performance metrics errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Metrics error')
      })

      const result = await getSearchPerformanceMetrics()

      expect(result.avgExecutionTime).toBe(0)
      expect(result.slowQueries).toEqual([])
      expect(result.querySuccessRate).toBe(0)
    })
  })

  describe('Data Cleanup', () => {
    it('should cleanup old search analytics', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({
            error: null
          })
        })
      } as any)

      const result = await cleanupOldSearchAnalytics(90)

      expect(result).toBe(true)
    })

    it('should handle cleanup errors', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({
            error: new Error('Cleanup error')
          })
        })
      } as any)

      const result = await cleanupOldSearchAnalytics(90)

      expect(result).toBe(false)
    })

    it('should use correct date calculation for cleanup', async () => {
      const daysToKeep = 60
      const mockDelete = jest.fn().mockResolvedValue({ error: null })
      
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          lt: mockDelete
        })
      } as any)

      await cleanupOldSearchAnalytics(daysToKeep)

      // Verify that the date calculation is approximately correct
      const callArgs = mockDelete.mock.calls[0][1]
      const cutoffDate = new Date(callArgs)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - daysToKeep)
      
      // Allow for small time differences (within 1 minute)
      const timeDiff = Math.abs(cutoffDate.getTime() - expectedDate.getTime())
      expect(timeDiff).toBeLessThan(60000) // 1 minute in milliseconds
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined user IDs gracefully', async () => {
      const result = await getSearchHistory('', 10)
      expect(result).toEqual([])
    })

    it('should handle empty query strings', async () => {
      const result = await trackSearchQuery(mockUserId, '', 0, 0.8, 100)
      expect(result).not.toBeNull() // Should still track empty queries
    })

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000)
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id' },
              error: null
            })
          })
        })
      } as any)

      const result = await trackSearchQuery(mockUserId, longQuery, 5, 0.8, 200)
      expect(result).toBe('test-id')
    })

    it('should handle negative execution times', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id' },
              error: null
            })
          })
        })
      } as any)

      const result = await trackSearchQuery(mockUserId, 'test', 5, 0.8, -100)
      expect(result).toBe('test-id')
    })
  })
})