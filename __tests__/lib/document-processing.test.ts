import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'

describe('Document Processing Core Functions', () => {
  // Test the core chunking logic without external dependencies
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

    it('should handle unknown mime types', () => {
      const content = 'Some content'
      const result = extractTextFromFile(content, 'application/unknown')
      
      expect(result).toBe(content)
    })
  })
})