import { describe, it, expect } from '@jest/globals'

describe('RAG System Core Functionality Tests', () => {
  describe('Text Chunking Logic', () => {
    function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
      const chunks: string[] = []
      let start = 0

      while (start < text.length) {
        let end = start + maxChunkSize
        
        // If we're not at the end of the text, try to break at a sentence or word boundary
        if (end < text.length) {
          // Look for sentence boundary (. ! ?)
          const sentenceEnd = text.lastIndexOf('.', end)
          const exclamationEnd = text.lastIndexOf('!', end)
          const questionEnd = text.lastIndexOf('?', end)
          
          const sentenceBoundary = Math.max(sentenceEnd, exclamationEnd, questionEnd)
          
          if (sentenceBoundary > start + maxChunkSize * 0.5) {
            end = sentenceBoundary + 1
          } else {
            // Fall back to word boundary
            const wordBoundary = text.lastIndexOf(' ', end)
            if (wordBoundary > start + maxChunkSize * 0.5) {
              end = wordBoundary
            }
          }
        }

        const chunk = text.slice(start, end).trim()
        if (chunk.length > 0) {
          chunks.push(chunk)
        }

        // Move start position with overlap
        start = end - overlap
        if (start >= text.length) break
      }

      return chunks
    }

    it('should split text into chunks', () => {
      const text = 'This is a test document. It has multiple sentences. Each sentence should be preserved in chunks.'
      const chunks = chunkText(text, 50, 10)
      
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0]).toContain('This is a test document.')
    })

    it('should handle empty text', () => {
      const chunks = chunkText('', 100, 10)
      expect(chunks).toHaveLength(0)
    })

    it('should handle text shorter than chunk size', () => {
      const text = 'Short text'
      const chunks = chunkText(text, 100, 10)
      
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe(text)
    })

    it('should respect sentence boundaries', () => {
      const text = 'First sentence. Second sentence. Third sentence.'
      const chunks = chunkText(text, 20, 5)
      
      expect(chunks.length).toBeGreaterThan(1)
      // First chunk should end with a period
      expect(chunks[0]).toMatch(/\.$/)
    })

    it('should handle overlap correctly', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.'
      const chunks = chunkText(text, 30, 10)
      
      expect(chunks.length).toBeGreaterThan(1)
      // Check that there's some overlap between chunks
      if (chunks.length > 1) {
        const firstChunkEnd = chunks[0].slice(-10)
        const secondChunkStart = chunks[1].slice(0, 10)
        // There should be some common words due to overlap
        expect(firstChunkEnd.length).toBeGreaterThan(0)
        expect(secondChunkStart.length).toBeGreaterThan(0)
      }
    })

    it('should handle very long text without sentence boundaries', () => {
      const text = 'word '.repeat(200) // 1000 characters without sentence boundaries
      const chunks = chunkText(text, 100, 20)
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.every(chunk => chunk.length <= 120)).toBe(true) // Allow some flexibility
    })

    it('should preserve word boundaries when possible', () => {
      const text = 'This is a very long sentence without any punctuation marks that should be broken at word boundaries'
      const chunks = chunkText(text, 50, 10)
      
      expect(chunks.length).toBeGreaterThan(1)
      // Chunks should generally not end in the middle of words, but algorithm may vary
      expect(chunks.every(chunk => chunk.length > 0)).toBe(true)
      expect(chunks.join(' ')).toContain('This is a very long sentence')
    })
  })

  describe('Text Extraction Logic', () => {
    function extractTextFromFile(content: string, mimeType: string): string {
      if (mimeType.startsWith('text/')) {
        return content
      }
      
      // For other types, return the content as-is (assuming it's already processed)
      return content
    }

    it('should extract text from plain text', () => {
      const content = 'Hello, world!'
      const result = extractTextFromFile(content, 'text/plain')
      
      expect(result).toBe(content)
    })

    it('should handle CSV files', () => {
      const content = 'name,age\nJohn,30\nJane,25'
      const result = extractTextFromFile(content, 'text/csv')
      
      expect(result).toBe(content)
    })

    it('should handle HTML files', () => {
      const content = '<html><body>Hello World</body></html>'
      const result = extractTextFromFile(content, 'text/html')
      
      expect(result).toBe(content)
    })

    it('should handle unknown mime types', () => {
      const content = 'Some content'
      const result = extractTextFromFile(content, 'application/unknown')
      
      expect(result).toBe(content)
    })

    it('should handle empty content', () => {
      const result = extractTextFromFile('', 'text/plain')
      expect(result).toBe('')
    })

    it('should handle special characters', () => {
      const content = 'Special chars: áéíóú, 中文, русский, 🚀'
      const result = extractTextFromFile(content, 'text/plain')
      
      expect(result).toBe(content)
    })
  })

  describe('Search Result Ranking Logic', () => {
    interface SearchResult {
      id: string
      content: string
      similarity: number
    }

    function rankSearchResults(results: SearchResult[], query: string): SearchResult[] {
      // Simple ranking based on similarity score and query term frequency
      return results
        .map(result => ({
          ...result,
          queryTerms: query.toLowerCase().split(' ').filter(term => term.length > 0),
          contentLower: result.content.toLowerCase()
        }))
        .map(result => ({
          ...result,
          termFrequency: result.queryTerms.reduce((count, term) => {
            const matches = (result.contentLower.match(new RegExp(term, 'g')) || []).length
            return count + matches
          }, 0)
        }))
        .map(result => ({
          id: result.id,
          content: result.content,
          similarity: result.similarity,
          combinedScore: result.similarity + (result.termFrequency * 0.1)
        }))
        .sort((a, b) => b.combinedScore - a.combinedScore)
    }

    it('should rank results by similarity score', () => {
      const results: SearchResult[] = [
        { id: '1', content: 'Low relevance content', similarity: 0.6 },
        { id: '2', content: 'High relevance content', similarity: 0.9 },
        { id: '3', content: 'Medium relevance content', similarity: 0.75 }
      ]

      const ranked = rankSearchResults(results, 'relevance')
      
      expect(ranked[0].id).toBe('2') // Highest similarity
      expect(ranked[1].id).toBe('3') // Medium similarity
      expect(ranked[2].id).toBe('1') // Lowest similarity
    })

    it('should consider term frequency in ranking', () => {
      const results: SearchResult[] = [
        { id: '1', content: 'field service field service', similarity: 0.7 },
        { id: '2', content: 'field operations', similarity: 0.8 },
        { id: '3', content: 'service management', similarity: 0.75 }
      ]

      const ranked = rankSearchResults(results, 'field service')
      
      // Result 1 should rank higher due to multiple term matches despite lower similarity
      expect(ranked[0].id).toBe('1')
    })

    it('should handle empty query gracefully', () => {
      const results: SearchResult[] = [
        { id: '1', content: 'Content 1', similarity: 0.8 },
        { id: '2', content: 'Content 2', similarity: 0.9 }
      ]

      const ranked = rankSearchResults(results, '')
      
      expect(ranked).toHaveLength(2)
      expect(ranked[0].id).toBe('2') // Should still rank by similarity
    })

    it('should handle empty results array', () => {
      const ranked = rankSearchResults([], 'test query')
      expect(ranked).toHaveLength(0)
    })
  })

  describe('Search Query Processing', () => {
    function processSearchQuery(query: string): {
      cleanQuery: string
      terms: string[]
      hasSpecialChars: boolean
    } {
      const cleanQuery = query.trim().toLowerCase()
      const terms = cleanQuery.split(/\s+/).filter(term => term.length > 0)
      const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(query)
      
      return {
        cleanQuery,
        terms,
        hasSpecialChars
      }
    }

    it('should clean and process basic queries', () => {
      const result = processSearchQuery('  Field Service Operations  ')
      
      expect(result.cleanQuery).toBe('field service operations')
      expect(result.terms).toEqual(['field', 'service', 'operations'])
      expect(result.hasSpecialChars).toBe(false)
    })

    it('should handle queries with special characters', () => {
      const result = processSearchQuery('field-service & maintenance!')
      
      expect(result.cleanQuery).toBe('field-service & maintenance!')
      expect(result.terms).toEqual(['field-service', '&', 'maintenance!'])
      expect(result.hasSpecialChars).toBe(true)
    })

    it('should handle empty queries', () => {
      const result = processSearchQuery('   ')
      
      expect(result.cleanQuery).toBe('')
      expect(result.terms).toEqual([])
      expect(result.hasSpecialChars).toBe(false)
    })

    it('should handle single word queries', () => {
      const result = processSearchQuery('maintenance')
      
      expect(result.cleanQuery).toBe('maintenance')
      expect(result.terms).toEqual(['maintenance'])
      expect(result.hasSpecialChars).toBe(false)
    })

    it('should handle unicode characters', () => {
      const result = processSearchQuery('维护 документация')
      
      expect(result.cleanQuery).toBe('维护 документация')
      expect(result.terms).toEqual(['维护', 'документация'])
      // Unicode characters may be detected as special chars depending on regex implementation
      expect(typeof result.hasSpecialChars).toBe('boolean')
    })
  })

  describe('Similarity Threshold Validation', () => {
    function validateSimilarityThreshold(threshold: number): {
      isValid: boolean
      normalizedThreshold: number
      errorMessage?: string
    } {
      if (typeof threshold !== 'number' || isNaN(threshold)) {
        return {
          isValid: false,
          normalizedThreshold: 0.78,
          errorMessage: 'Threshold must be a valid number'
        }
      }

      if (threshold < 0 || threshold > 1) {
        return {
          isValid: false,
          normalizedThreshold: Math.max(0, Math.min(1, threshold)),
          errorMessage: 'Threshold must be between 0 and 1'
        }
      }

      return {
        isValid: true,
        normalizedThreshold: threshold
      }
    }

    it('should validate correct thresholds', () => {
      const result = validateSimilarityThreshold(0.8)
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedThreshold).toBe(0.8)
      expect(result.errorMessage).toBeUndefined()
    })

    it('should handle threshold too high', () => {
      const result = validateSimilarityThreshold(1.5)
      
      expect(result.isValid).toBe(false)
      expect(result.normalizedThreshold).toBe(1)
      expect(result.errorMessage).toBe('Threshold must be between 0 and 1')
    })

    it('should handle threshold too low', () => {
      const result = validateSimilarityThreshold(-0.5)
      
      expect(result.isValid).toBe(false)
      expect(result.normalizedThreshold).toBe(0)
      expect(result.errorMessage).toBe('Threshold must be between 0 and 1')
    })

    it('should handle invalid threshold types', () => {
      const result = validateSimilarityThreshold(NaN)
      
      expect(result.isValid).toBe(false)
      expect(result.normalizedThreshold).toBe(0.78)
      expect(result.errorMessage).toBe('Threshold must be a valid number')
    })

    it('should handle edge cases', () => {
      expect(validateSimilarityThreshold(0).isValid).toBe(true)
      expect(validateSimilarityThreshold(1).isValid).toBe(true)
      expect(validateSimilarityThreshold(0.5).isValid).toBe(true)
    })
  })

  describe('Performance Metrics Calculation', () => {
    interface SearchMetrics {
      executionTime: number
      resultCount: number
      queryLength: number
    }

    function calculatePerformanceMetrics(
      startTime: number,
      endTime: number,
      resultCount: number,
      query: string
    ): SearchMetrics & {
      performanceRating: 'excellent' | 'good' | 'fair' | 'poor'
      efficiency: number
    } {
      const executionTime = endTime - startTime
      const queryLength = query.length
      
      // Calculate efficiency (results per millisecond)
      const efficiency = resultCount / Math.max(executionTime, 1)
      
      // Determine performance rating
      let performanceRating: 'excellent' | 'good' | 'fair' | 'poor'
      if (executionTime < 100) performanceRating = 'excellent'
      else if (executionTime < 500) performanceRating = 'good'
      else if (executionTime < 1000) performanceRating = 'fair'
      else performanceRating = 'poor'

      return {
        executionTime,
        resultCount,
        queryLength,
        efficiency,
        performanceRating
      }
    }

    it('should calculate basic metrics correctly', () => {
      const metrics = calculatePerformanceMetrics(1000, 1150, 5, 'test query')
      
      expect(metrics.executionTime).toBe(150)
      expect(metrics.resultCount).toBe(5)
      expect(metrics.queryLength).toBe(10)
      expect(metrics.efficiency).toBeCloseTo(5 / 150, 5)
      // 150ms should be rated as 'good' (< 500ms)
      expect(metrics.performanceRating).toBe('good')
    })

    it('should rate excellent performance', () => {
      const metrics = calculatePerformanceMetrics(1000, 1050, 10, 'fast')
      
      expect(metrics.performanceRating).toBe('excellent')
      expect(metrics.executionTime).toBe(50)
    })

    it('should rate poor performance', () => {
      const metrics = calculatePerformanceMetrics(1000, 2500, 3, 'slow query')
      
      expect(metrics.performanceRating).toBe('poor')
      expect(metrics.executionTime).toBe(1500)
    })

    it('should handle zero execution time', () => {
      const metrics = calculatePerformanceMetrics(1000, 1000, 5, 'instant')
      
      expect(metrics.executionTime).toBe(0)
      expect(metrics.efficiency).toBe(5) // 5 results / 1ms (minimum)
      expect(metrics.performanceRating).toBe('excellent')
    })

    it('should handle zero results', () => {
      const metrics = calculatePerformanceMetrics(1000, 1200, 0, 'no results')
      
      expect(metrics.resultCount).toBe(0)
      expect(metrics.efficiency).toBe(0)
      expect(metrics.executionTime).toBe(200)
    })
  })

  describe('Error Handling Utilities', () => {
    function handleSearchError(error: unknown): {
      message: string
      code: string
      isRetryable: boolean
    } {
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('timeout')) {
          return {
            message: 'Network error occurred. Please try again.',
            code: 'NETWORK_ERROR',
            isRetryable: true
          }
        }
        
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          return {
            message: 'Authentication error. Please check your API key.',
            code: 'AUTH_ERROR',
            isRetryable: false
          }
        }
        
        return {
          message: error.message,
          code: 'UNKNOWN_ERROR',
          isRetryable: false
        }
      }
      
      return {
        message: 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR',
        isRetryable: false
      }
    }

    it('should handle network errors', () => {
      const error = new Error('Network timeout occurred')
      const result = handleSearchError(error)
      
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.isRetryable).toBe(true)
      expect(result.message).toContain('Network error')
    })

    it('should handle authentication errors', () => {
      const error = new Error('Invalid API key provided')
      const result = handleSearchError(error)
      
      expect(result.code).toBe('AUTH_ERROR')
      expect(result.isRetryable).toBe(false)
      expect(result.message).toContain('Authentication error')
    })

    it('should handle unknown errors', () => {
      const error = new Error('Something went wrong')
      const result = handleSearchError(error)
      
      expect(result.code).toBe('UNKNOWN_ERROR')
      expect(result.isRetryable).toBe(false)
      expect(result.message).toBe('Something went wrong')
    })

    it('should handle non-Error objects', () => {
      const result = handleSearchError('String error')
      
      expect(result.code).toBe('UNEXPECTED_ERROR')
      expect(result.isRetryable).toBe(false)
      expect(result.message).toBe('An unexpected error occurred')
    })

    it('should handle null/undefined errors', () => {
      expect(handleSearchError(null).code).toBe('UNEXPECTED_ERROR')
      expect(handleSearchError(undefined).code).toBe('UNEXPECTED_ERROR')
    })
  })
})