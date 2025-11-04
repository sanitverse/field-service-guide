import OpenAI from 'openai'

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embeddings for text content using OpenAI's text-embedding-3-small model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw new Error('Failed to generate embeddings')
  }
}

/**
 * Split text into chunks for processing
 * This is a simple implementation - in production you might want more sophisticated chunking
 */
export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
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

/**
 * Extract text content from different file types
 * This is a basic implementation - you might want to use specialized libraries for better extraction
 */
export function extractTextFromFile(content: string, mimeType: string): string {
  // For now, we'll handle plain text and assume other formats are already processed
  // In a production system, you'd want to handle PDF, DOCX, etc.
  
  if (mimeType.startsWith('text/')) {
    return content
  }
  
  // For other types, return the content as-is (assuming it's already processed)
  return content
}