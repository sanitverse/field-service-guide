import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { POST } from '@/app/api/documents/process/route'
import { processDocumentForRAG } from '@/lib/document-processing'
import { supabase } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/document-processing')
jest.mock('@/lib/supabase')

const mockProcessDocumentForRAG = processDocumentForRAG as jest.MockedFunction<typeof processDocumentForRAG>
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Documents Process API', () => {
  const mockFileRecord = {
    id: 'test-file-id',
    filename: 'test-document.txt',
    file_path: '/test/path',
    file_size: 1024,
    mime_type: 'text/plain',
    uploaded_by: 'user-id',
    related_task_id: null,
    is_processed: false,
    created_at: '2024-01-01T00:00:00Z'
  }

  const mockTextContent = 'This is a test document with content to be processed for RAG.'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/documents/process', () => {
    it('should process document successfully', async () => {
      // Mock successful file retrieval
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFileRecord,
              error: null
            })
          })
        })
      } as any)

      // Mock successful processing
      mockProcessDocumentForRAG.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Document processed successfully')

      expect(mockProcessDocumentForRAG).toHaveBeenCalledWith(mockFileRecord, mockTextContent)
    })

    it('should return 400 for missing fileId', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File ID and text content are required')
    })

    it('should return 400 for missing textContent', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File ID and text content are required')
    })

    it('should return 400 for empty fileId', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: '',
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File ID and text content are required')
    })

    it('should return 400 for empty textContent', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: ''
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File ID and text content are required')
    })

    it('should return 404 for non-existent file', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('File not found')
            })
          })
        })
      } as any)

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'non-existent-file',
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('File not found')
    })

    it('should return 404 when file data is null', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      } as any)

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('File not found')
    })

    it('should return 500 when processing fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFileRecord,
              error: null
            })
          })
        })
      } as any)

      mockProcessDocumentForRAG.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process document')
    })

    it('should handle processing exceptions', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFileRecord,
              error: null
            })
          })
        })
      } as any)

      mockProcessDocumentForRAG.mockRejectedValue(new Error('Processing error'))

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: mockTextContent
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

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/process', {
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

    it('should handle database connection errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: mockTextContent
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

    it('should process large text content', async () => {
      const largeTextContent = 'This is a large document. '.repeat(1000)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFileRecord,
              error: null
            })
          })
        })
      } as any)

      mockProcessDocumentForRAG.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: largeTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockProcessDocumentForRAG).toHaveBeenCalledWith(mockFileRecord, largeTextContent)
    })

    it('should handle special characters in text content', async () => {
      const specialTextContent = 'Document with special chars: áéíóú, 中文, русский, 🚀'

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFileRecord,
              error: null
            })
          })
        })
      } as any)

      mockProcessDocumentForRAG.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: specialTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockProcessDocumentForRAG).toHaveBeenCalledWith(mockFileRecord, specialTextContent)
    })

    it('should validate file ID format', async () => {
      const invalidFileIds = ['', '   ', null, undefined, 123, {}, []]

      for (const invalidId of invalidFileIds) {
        const request = new NextRequest('http://localhost:3000/api/documents/process', {
          method: 'POST',
          body: JSON.stringify({
            fileId: invalidId,
            textContent: mockTextContent
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('File ID and text content are required')
      }
    })

    it('should handle concurrent processing requests', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFileRecord,
              error: null
            })
          })
        })
      } as any)

      mockProcessDocumentForRAG.mockResolvedValue(true)

      const requests = Array(3).fill(null).map((_, i) => 
        new NextRequest('http://localhost:3000/api/documents/process', {
          method: 'POST',
          body: JSON.stringify({
            fileId: `test-file-${i}`,
            textContent: `Content for file ${i}`
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
      expect(mockProcessDocumentForRAG).toHaveBeenCalledTimes(3)
    })

    it('should handle processing timeout gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFileRecord,
              error: null
            })
          })
        })
      } as any)

      // Simulate a long-running process
      mockProcessDocumentForRAG.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 5000))
      )

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const startTime = Date.now()
      const response = await POST(request)
      const endTime = Date.now()

      // Should complete (even if it takes time)
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeGreaterThan(4000) // Should take at least 4 seconds
    }, 10000) // Increase test timeout to 10 seconds

    it('should preserve file metadata during processing', async () => {
      const fileWithMetadata = {
        ...mockFileRecord,
        mime_type: 'application/pdf',
        file_size: 2048,
        related_task_id: 'task-123'
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: fileWithMetadata,
              error: null
            })
          })
        })
      } as any)

      mockProcessDocumentForRAG.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/documents/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'test-file-id',
          textContent: mockTextContent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockProcessDocumentForRAG).toHaveBeenCalledWith(fileWithMetadata, mockTextContent)
    })
  })
})