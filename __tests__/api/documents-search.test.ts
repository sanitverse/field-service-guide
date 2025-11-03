import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { POST, GET } from '@/app/api/documents/search/route'
import { searchDocumentChunks } from '@/lib/document-processing'
import { NextRequest } from 'next/server'

// Mock the document processing module
jest.mock('@/lib/document-processing')
const mockSearchDocumentChunks = searchDocumentChunks as jest.MockedFunction<typeof searchDocumentChunks>

describe('Documents Search API', () => {
  const mockSearchResults = [
    {
      id: 'chunk-1',
      file_id: 'file-1',
      content: 'This is a test document about field service operations.',
      similarity: 0.95,
      metadata: { chunk_index: 0 },
      file: {
        id: 'file-1',
        filename: 'test-doc.txt',
        mime_type: 'text/plain',
        created_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: 'chunk-2',
      file_id: 'file-1',
      content: 'Additional information about maintenance procedures.',
      similarity: 0.87,
      metadata: { chunk_index: 1 },
      file: {
        id: 'file-1',
        filename: 'test-doc.txt',
        mime_type: 'text/plain',
        created_at: '2024-01-01T00:00:00Z'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/documents/search', () => {
    it('should search documents successfully', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'field service operations',
          options: {
            matchThreshold: 0.8,
            matchCount: 10
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.results).toEqual(mockSearchResults)
      expect(data.query).toBe('field service operations')
      expect(data.count).toBe(2)

      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('field service operations', {
        matchThreshold: 0.8,
        matchCount: 10,
        fileIds: undefined
      })
    })

    it('should handle search with file filtering', async () => {
      mockSearchDocumentChunks.mockResolvedValue([mockSearchResults[0]])

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'field service',
          options: {
            matchThreshold: 0.75,
            matchCount: 5,
            fileIds: ['file-1', 'file-2']
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('field service', {
        matchThreshold: 0.75,
        matchCount: 5,
        fileIds: ['file-1', 'file-2']
      })
    })

    it('should use default options when not provided', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('test query', {
        matchThreshold: 0.78,
        matchCount: 10,
        fileIds: undefined
      })
    })

    it('should return 400 for missing query', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search query is required')
    })

    it('should return 400 for empty query', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: '   '
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search query is required')
    })

    it('should return 400 for non-string query', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 123
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search query is required')
    })

    it('should handle search errors gracefully', async () => {
      mockSearchDocumentChunks.mockRejectedValue(new Error('Search failed'))

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should trim query whitespace', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: '  field service  '
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe('field service')
      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('field service', expect.any(Object))
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/documents/search', () => {
    it('should search documents with query parameters', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const url = new URL('http://localhost:3000/api/documents/search')
      url.searchParams.set('q', 'field service')
      url.searchParams.set('threshold', '0.85')
      url.searchParams.set('count', '5')
      url.searchParams.set('fileIds', 'file-1,file-2')

      const request = new NextRequest(url.toString(), {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.results).toEqual(mockSearchResults)
      expect(data.query).toBe('field service')

      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('field service', {
        matchThreshold: 0.85,
        matchCount: 5,
        fileIds: ['file-1', 'file-2']
      })
    })

    it('should use default parameters when not provided', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const url = new URL('http://localhost:3000/api/documents/search')
      url.searchParams.set('q', 'test query')

      const request = new NextRequest(url.toString(), {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('test query', {
        matchThreshold: 0.78,
        matchCount: 10,
        fileIds: undefined
      })
    })

    it('should handle empty fileIds parameter', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const url = new URL('http://localhost:3000/api/documents/search')
      url.searchParams.set('q', 'test query')
      url.searchParams.set('fileIds', '')

      const request = new NextRequest(url.toString(), {
        method: 'GET'
      })

      const response = await GET(request)

      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('test query', {
        matchThreshold: 0.78,
        matchCount: 10,
        fileIds: undefined
      })
    })

    it('should filter empty file IDs', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const url = new URL('http://localhost:3000/api/documents/search')
      url.searchParams.set('q', 'test query')
      url.searchParams.set('fileIds', 'file-1,,file-2,')

      const request = new NextRequest(url.toString(), {
        method: 'GET'
      })

      const response = await GET(request)

      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('test query', {
        matchThreshold: 0.78,
        matchCount: 10,
        fileIds: ['file-1', 'file-2']
      })
    })

    it('should return 400 for missing query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search query is required')
    })

    it('should return 400 for empty query parameter', async () => {
      const url = new URL('http://localhost:3000/api/documents/search')
      url.searchParams.set('q', '   ')

      const request = new NextRequest(url.toString(), {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search query is required')
    })

    it('should handle invalid numeric parameters gracefully', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const url = new URL('http://localhost:3000/api/documents/search')
      url.searchParams.set('q', 'test query')
      url.searchParams.set('threshold', 'invalid')
      url.searchParams.set('count', 'not-a-number')

      const request = new NextRequest(url.toString(), {
        method: 'GET'
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSearchDocumentChunks).toHaveBeenCalledWith('test query', {
        matchThreshold: NaN, // parseFloat('invalid') returns NaN
        matchCount: NaN,     // parseInt('not-a-number') returns NaN
        fileIds: undefined
      })
    })

    it('should handle GET search errors gracefully', async () => {
      mockSearchDocumentChunks.mockRejectedValue(new Error('Search failed'))

      const url = new URL('http://localhost:3000/api/documents/search')
      url.searchParams.set('q', 'test query')

      const request = new NextRequest(url.toString(), {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Search Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array(100).fill(null).map((_, i) => ({
        ...mockSearchResults[0],
        id: `chunk-${i}`,
        content: `Content chunk ${i}`
      }))

      mockSearchDocumentChunks.mockResolvedValue(largeResultSet)

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'performance test',
          options: { matchCount: 100 }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const startTime = Date.now()
      const response = await POST(request)
      const endTime = Date.now()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent search requests', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const requests = Array(5).fill(null).map((_, i) => 
        new NextRequest('http://localhost:3000/api/documents/search', {
          method: 'POST',
          body: JSON.stringify({
            query: `concurrent query ${i}`
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )

      const responses = await Promise.all(requests.map(req => POST(req)))
      const results = await Promise.all(responses.map(res => res.json()))

      expect(responses.every(res => res.status === 200)).toBe(true)
      expect(results.every(data => data.success === true)).toBe(true)
      expect(mockSearchDocumentChunks).toHaveBeenCalledTimes(5)
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('should handle special characters in query', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const specialQuery = 'field service: "maintenance" & repairs (urgent)'

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: specialQuery
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe(specialQuery)
      expect(mockSearchDocumentChunks).toHaveBeenCalledWith(specialQuery, expect.any(Object))
    })

    it('should handle Unicode characters in query', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const unicodeQuery = 'field service 维护 документация'

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: unicodeQuery
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe(unicodeQuery)
    })

    it('should handle very long queries', async () => {
      mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)

      const longQuery = 'field service '.repeat(100) // Very long query

      const request = new NextRequest('http://localhost:3000/api/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: longQuery.trim()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe(longQuery.trim())
    })
  })
})