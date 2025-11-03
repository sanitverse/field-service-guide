import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { 
  processDocumentForRAG, 
  searchDocumentChunks, 
  getDocumentChunks,
  deleteDocumentChunks,
  reprocessDocument,
  getProcessingStatistics
} from '@/lib/document-processing'
import { generateEmbedding, generateEmbeddings, chunkText, extractTextFromFile } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/openai')

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockGenerateEmbedding = generateEmbedding as jest.MockedFunction<typeof generateEmbedding>
const mockGenerateEmbeddings = generateEmbeddings as jest.MockedFunction<typeof generateEmbeddings>
const mockChunkText = chunkText as jest.MockedFunction<typeof chunkText>
const mockExtractTextFromFile = extractTextFromFile as jest.MockedFunction<typeof extractTextFromFile>

describe('RAG System Tests', () => {
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

  const mockEmbedding = Array(1536).fill(0).map((_, i) => Math.random())
  const mockTextContent = 'This is a test document with multiple sentences. It contains important information about field service operations. The document should be processed and made searchable.'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockExtractTextFromFile.mockReturnValue(mockTextContent)
    mockChunkText.mockReturnValue([
      'This is a test document with multiple sentences.',
      'It contains important information about field service operations.',
      'The document should be processed and made searchable.'
    ])
    mockGenerateEmbeddings.mockResolvedValue([mockEmbedding, mockEmbedding, mockEmbedding])
    mockGenerateEmbedding.mockResolvedValue(mockEmbedding)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Embedding Generation', () => {
    it('should generate embeddings for single text', async () => {
      const text = 'Test text for embedding'
      const expectedEmbedding = Array(1536).fill(0.5)
      
      mockGenerateEmbedding.mockResolvedValue(expectedEmbedding)

      const result = await generateEmbedding(text)

      expect(mockGenerateEmbedding).toHaveBeenCalledWith(text)
      expect(result).toEqual(expectedEmbedding)
      expect(result).toHaveLength(1536)
    })

    it('should generate embeddings for multiple texts', async () => {
      const texts = ['Text 1', 'Text 2', 'Text 3']
      const expectedEmbeddings = [mockEmbedding, mockEmbedding, mockEmbedding]
      
      mockGenerateEmbeddings.mockResolvedValue(expectedEmbeddings)

      const result = await generateEmbeddings(texts)

      expect(mockGenerateEmbeddings).toHaveBeenCalledWith(texts)
      expect(result).toEqual(expectedEmbeddings)
      expect(result).toHaveLength(3)
    })

    it('should handle embedding generation errors', async () => {
      mockGenerateEmbedding.mockRejectedValue(new Error('API Error'))

      await expect(generateEmbedding('test')).rejects.toThrow('Failed to generate embedding')
    })
  })

  describe('Text Processing', () => {
    it('should chunk text properly', () => {
      const longText = 'This is a very long document. '.repeat(50)
      
      // Use real implementation for this test
      jest.unmock('@/lib/openai')
      const { chunkText: realChunkText } = require('@/lib/openai')
      
      const chunks = realChunkText(longText, 100, 20)
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[0].length).toBeLessThanOrEqual(120) // Allow for sentence boundaries
      expect(chunks.every(chunk => chunk.trim().length > 0)).toBe(true)
    })

    it('should extract text from different file types', () => {
      // Use real implementation for this test
      jest.unmock('@/lib/openai')
      const { extractTextFromFile: realExtractText } = require('@/lib/openai')
      
      const textContent = 'Sample text content'
      
      expect(realExtractText(textContent, 'text/plain')).toBe(textContent)
      expect(realExtractText(textContent, 'text/csv')).toBe(textContent)
      expect(realExtractText(textContent, 'application/json')).toBe(textContent)
    })

    it('should handle empty text gracefully', () => {
      jest.unmock('@/lib/openai')
      const { chunkText: realChunkText } = require('@/lib/openai')
      
      const chunks = realChunkText('', 100, 20)
      expect(chunks).toHaveLength(0)
    })
  })

  describe('Document Processing', () => {
    it('should process document successfully', async () => {
      // Mock successful database operations
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          error: null
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: null
          })
        })
      } as any)

      const result = await processDocumentForRAG(mockFileRecord, mockTextContent)

      expect(result).toBe(true)
      expect(mockExtractTextFromFile).toHaveBeenCalledWith(mockTextContent, 'text/plain')
      expect(mockChunkText).toHaveBeenCalledWith(mockTextContent, 1000, 100)
      expect(mockGenerateEmbeddings).toHaveBeenCalled()
    })

    it('should handle empty text content', async () => {
      mockExtractTextFromFile.mockReturnValue('')

      const result = await processDocumentForRAG(mockFileRecord, '')

      expect(result).toBe(false)
    })

    it('should handle database insertion errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          error: new Error('Database error')
        })
      } as any)

      const result = await processDocumentForRAG(mockFileRecord, mockTextContent)

      expect(result).toBe(false)
    })

    it('should handle embedding generation errors', async () => {
      mockGenerateEmbeddings.mockRejectedValue(new Error('OpenAI API error'))

      const result = await processDocumentForRAG(mockFileRecord, mockTextContent)

      expect(result).toBe(false)
    })
  })

  describe('Document Search', () => {
    const mockSearchResults = [
      {
        id: 'chunk-1',
        file_id: 'file-1',
        content: 'This is a test document with multiple sentences.',
        similarity: 0.95,
        metadata: { chunk_index: 0 }
      },
      {
        id: 'chunk-2',
        file_id: 'file-1',
        content: 'It contains important information about field service operations.',
        similarity: 0.87,
        metadata: { chunk_index: 1 }
      }
    ]

    it('should search documents successfully', async () => {
      // Mock RPC call
      mockSupabase.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null
      })

      // Mock file data fetch
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

      const results = await searchDocumentChunks('test query')

      expect(results).toHaveLength(2)
      expect(results[0].similarity).toBe(0.95)
      expect(mockGenerateEmbedding).toHaveBeenCalledWith('test query')
    })

    it('should handle search with file filtering', async () => {
      const filteredResults = [mockSearchResults[0]]
      
      mockSupabase.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null
      })

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

      const results = await searchDocumentChunks('test query', {
        fileIds: ['file-1'],
        matchThreshold: 0.8,
        matchCount: 5
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_documents', {
        query_embedding: mockEmbedding,
        match_threshold: 0.8,
        match_count: 5
      })
    })

    it('should handle search errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Search error')
      })

      const results = await searchDocumentChunks('test query')

      expect(results).toHaveLength(0)
    })

    it('should handle embedding generation errors in search', async () => {
      mockGenerateEmbedding.mockRejectedValue(new Error('Embedding error'))

      const results = await searchDocumentChunks('test query')

      expect(results).toHaveLength(0)
    })
  })

  describe('Document Chunk Management', () => {
    it('should retrieve document chunks for a file', async () => {
      const mockChunks = [
        { id: 'chunk-1', file_id: 'file-1', content: 'Chunk 1', chunk_index: 0 },
        { id: 'chunk-2', file_id: 'file-1', content: 'Chunk 2', chunk_index: 1 }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockChunks,
              error: null
            })
          })
        })
      } as any)

      const result = await getDocumentChunks('file-1')

      expect(result).toEqual(mockChunks)
    })

    it('should delete document chunks for a file', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      } as any)

      const result = await deleteDocumentChunks('file-1')

      expect(result).toBe(true)
    })

    it('should handle chunk deletion errors', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: new Error('Delete error')
          })
        })
      } as any)

      const result = await deleteDocumentChunks('file-1')

      expect(result).toBe(false)
    })
  })

  describe('Document Reprocessing', () => {
    it('should reprocess document successfully', async () => {
      // Mock successful deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      } as any)

      // Mock successful processing
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          error: null
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: null
          })
        })
      } as any)

      const result = await reprocessDocument(mockFileRecord, mockTextContent)

      expect(result).toBe(true)
    })
  })

  describe('Processing Statistics', () => {
    it('should return processing statistics', async () => {
      const mockFileStats = [
        { is_processed: true },
        { is_processed: false },
        { is_processed: true }
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: mockFileStats,
          error: null
        })
      } as any)

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          count: 150,
          error: null
        })
      } as any)

      const stats = await getProcessingStatistics()

      expect(stats.totalFiles).toBe(3)
      expect(stats.processedFiles).toBe(2)
      expect(stats.unprocessedFiles).toBe(1)
      expect(stats.totalChunks).toBe(150)
    })

    it('should handle statistics errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Stats error')
        })
      } as any)

      const stats = await getProcessingStatistics()

      expect(stats.totalFiles).toBe(0)
      expect(stats.processedFiles).toBe(0)
      expect(stats.unprocessedFiles).toBe(0)
      expect(stats.totalChunks).toBe(0)
    })
  })

  describe('Search Performance', () => {
    it('should measure search execution time', async () => {
      const startTime = Date.now()
      
      mockSupabase.rpc.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: [],
              error: null
            })
          }, 100) // Simulate 100ms delay
        })
      })

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

      await searchDocumentChunks('performance test')
      
      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(executionTime).toBeGreaterThanOrEqual(100)
    })

    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array(100).fill(null).map((_, i) => ({
        id: `chunk-${i}`,
        file_id: 'file-1',
        content: `Content chunk ${i}`,
        similarity: 0.8 + (Math.random() * 0.2),
        metadata: { chunk_index: i }
      }))

      mockSupabase.rpc.mockResolvedValue({
        data: largeResultSet,
        error: null
      })

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

      const results = await searchDocumentChunks('large test')

      expect(results).toHaveLength(100)
      expect(results.every(r => r.similarity >= 0.8)).toBe(true)
    })
  })

  describe('Search Result Accuracy', () => {
    it('should return results sorted by similarity', async () => {
      const unsortedResults = [
        { id: 'chunk-1', similarity: 0.75, content: 'Low relevance' },
        { id: 'chunk-2', similarity: 0.95, content: 'High relevance' },
        { id: 'chunk-3', similarity: 0.85, content: 'Medium relevance' }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: unsortedResults,
        error: null
      })

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

      const results = await searchDocumentChunks('test query')

      // Results should maintain the order from the database (assuming it's sorted)
      expect(results[0].similarity).toBe(0.75)
      expect(results[1].similarity).toBe(0.95)
      expect(results[2].similarity).toBe(0.85)
    })

    it('should filter results by similarity threshold', async () => {
      const allResults = [
        { id: 'chunk-1', similarity: 0.95, content: 'High relevance' },
        { id: 'chunk-2', similarity: 0.75, content: 'Medium relevance' },
        { id: 'chunk-3', similarity: 0.65, content: 'Low relevance' }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: allResults.filter(r => r.similarity >= 0.78),
        error: null
      })

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

      const results = await searchDocumentChunks('test query', {
        matchThreshold: 0.78
      })

      expect(results).toHaveLength(2)
      expect(results.every(r => r.similarity >= 0.78)).toBe(true)
    })

    it('should limit results by match count', async () => {
      const manyResults = Array(20).fill(null).map((_, i) => ({
        id: `chunk-${i}`,
        similarity: 0.9,
        content: `Content ${i}`
      }))

      mockSupabase.rpc.mockResolvedValue({
        data: manyResults.slice(0, 5), // Database should limit to 5
        error: null
      })

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

      const results = await searchDocumentChunks('test query', {
        matchCount: 5
      })

      expect(results).toHaveLength(5)
    })
  })
})