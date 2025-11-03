// File processing utilities for RAG pipeline

import { supabaseAdmin } from './supabase'

export interface ProcessingResult {
  success: boolean
  chunks?: DocumentChunk[]
  error?: string
}

export interface DocumentChunk {
  content: string
  metadata: Record<string, any>
  chunk_index: number
}

export interface FileProcessingOptions {
  chunkSize?: number
  chunkOverlap?: number
  maxChunks?: number
}

const DEFAULT_CHUNK_SIZE = 1000
const DEFAULT_CHUNK_OVERLAP = 200
const MAX_CHUNKS_PER_FILE = 100

/**
 * Extract text content from different file types
 */
export async function extractTextFromFile(
  fileBuffer: ArrayBuffer, 
  mimeType: string, 
  filename: string
): Promise<string> {
  switch (mimeType) {
    case 'text/plain':
    case 'text/csv':
      return new TextDecoder().decode(fileBuffer)
    
    case 'application/json':
      try {
        const jsonContent = JSON.parse(new TextDecoder().decode(fileBuffer))
        return JSON.stringify(jsonContent, null, 2)
      } catch {
        return new TextDecoder().decode(fileBuffer)
      }
    
    case 'text/html':
      // Basic HTML text extraction (remove tags)
      const htmlContent = new TextDecoder().decode(fileBuffer)
      return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    case 'application/pdf':
      // PDF processing would require a library like pdf-parse
      // For now, return a placeholder
      return `PDF file: ${filename}\n[PDF content extraction requires additional processing]`
    
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // Word document processing would require libraries like mammoth
      return `Word document: ${filename}\n[Word document extraction requires additional processing]`
    
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      // Excel processing would require libraries like xlsx
      return `Excel file: ${filename}\n[Excel content extraction requires additional processing]`
    
    default:
      throw new Error(`Unsupported file type: ${mimeType}`)
  }
}

/**
 * Split text into chunks for embedding
 */
export function chunkText(
  text: string, 
  options: FileProcessingOptions = {}
): DocumentChunk[] {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
    maxChunks = MAX_CHUNKS_PER_FILE
  } = options

  if (text.length === 0) {
    return []
  }

  const chunks: DocumentChunk[] = []
  let startIndex = 0
  let chunkIndex = 0

  while (startIndex < text.length && chunkIndex < maxChunks) {
    let endIndex = startIndex + chunkSize

    // If this isn't the last chunk, try to break at a sentence or word boundary
    if (endIndex < text.length) {
      // Look for sentence endings within the last 100 characters
      const sentenceEnd = text.lastIndexOf('.', endIndex)
      const questionEnd = text.lastIndexOf('?', endIndex)
      const exclamationEnd = text.lastIndexOf('!', endIndex)
      
      const bestSentenceEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd)
      
      if (bestSentenceEnd > startIndex + chunkSize * 0.7) {
        endIndex = bestSentenceEnd + 1
      } else {
        // Fall back to word boundary
        const wordBoundary = text.lastIndexOf(' ', endIndex)
        if (wordBoundary > startIndex + chunkSize * 0.5) {
          endIndex = wordBoundary
        }
      }
    }

    const chunkContent = text.slice(startIndex, endIndex).trim()
    
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        chunk_index: chunkIndex,
        metadata: {
          start_index: startIndex,
          end_index: endIndex,
          length: chunkContent.length,
          word_count: chunkContent.split(/\s+/).length
        }
      })
      chunkIndex++
    }

    // Move start index forward, accounting for overlap
    startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap)
  }

  return chunks
}

/**
 * Generate embeddings for text chunks using OpenAI
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Import the OpenAI function
  const { generateEmbeddings: openaiGenerateEmbeddings } = await import('./openai')
  return await openaiGenerateEmbeddings(texts)
}

/**
 * Process a file and store chunks with embeddings
 */
export async function processFileForRAG(
  fileId: string,
  options: FileProcessingOptions = {}
): Promise<ProcessingResult> {
  try {
    // Get file record
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return { success: false, error: 'File not found' }
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('task-files')
      .download(file.file_path)

    if (downloadError || !fileData) {
      return { success: false, error: 'Failed to download file' }
    }

    // Extract text content
    const fileBuffer = await fileData.arrayBuffer()
    let textContent: string

    try {
      textContent = await extractTextFromFile(fileBuffer, file.mime_type || '', file.filename)
    } catch (extractError) {
      return { 
        success: false, 
        error: `Failed to extract text: ${extractError instanceof Error ? extractError.message : 'Unknown error'}` 
      }
    }

    // Chunk the text
    const chunks = chunkText(textContent, options)

    if (chunks.length === 0) {
      return { success: false, error: 'No content could be extracted from file' }
    }

    // Generate embeddings
    const chunkTexts = chunks.map(chunk => chunk.content)
    const embeddings = await generateEmbeddings(chunkTexts)

    // Store chunks in database
    const chunksToInsert = chunks.map((chunk, index) => ({
      file_id: fileId,
      content: chunk.content,
      embedding: embeddings[index],
      chunk_index: chunk.chunk_index,
      metadata: chunk.metadata
    }))

    const { error: insertError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunksToInsert)

    if (insertError) {
      return { success: false, error: `Failed to store chunks: ${insertError.message}` }
    }

    // Mark file as processed
    const { error: updateError } = await supabaseAdmin
      .from('files')
      .update({ is_processed: true })
      .eq('id', fileId)

    if (updateError) {
      console.error('Failed to mark file as processed:', updateError)
    }

    return { success: true, chunks }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Processing failed' 
    }
  }
}

/**
 * Reprocess a file (delete existing chunks and process again)
 */
export async function reprocessFile(
  fileId: string,
  options: FileProcessingOptions = {}
): Promise<ProcessingResult> {
  try {
    // Delete existing chunks
    const { error: deleteError } = await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('file_id', fileId)

    if (deleteError) {
      console.error('Failed to delete existing chunks:', deleteError)
    }

    // Mark file as unprocessed
    await supabaseAdmin
      .from('files')
      .update({ is_processed: false })
      .eq('id', fileId)

    // Process the file
    return await processFileForRAG(fileId, options)
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Reprocessing failed' 
    }
  }
}

/**
 * Get processing statistics
 */
export async function getProcessingStats() {
  try {
    const { data: stats, error } = await supabaseAdmin
      .rpc('get_storage_statistics')

    if (error) {
      throw error
    }

    return stats[0] || {
      total_files: 0,
      total_size_bytes: 0,
      processed_files: 0,
      unprocessed_files: 0,
      avg_file_size_mb: 0
    }
  } catch (error) {
    console.error('Failed to get processing stats:', error)
    return {
      total_files: 0,
      total_size_bytes: 0,
      processed_files: 0,
      unprocessed_files: 0,
      avg_file_size_mb: 0
    }
  }
}

/**
 * Check if a file type can be processed
 */
export function canProcessFileType(mimeType: string): boolean {
  const processableTypes = [
    'text/plain',
    'text/csv',
    'application/json',
    'text/html',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  return processableTypes.includes(mimeType)
}

/**
 * Estimate processing time based on file size and type
 */
export function estimateProcessingTime(fileSize: number, mimeType: string): number {
  // Base processing time in seconds
  let baseTime = 5

  // Adjust based on file size (rough estimate)
  const sizeMB = fileSize / (1024 * 1024)
  baseTime += sizeMB * 2

  // Adjust based on file type complexity
  if (mimeType.includes('pdf')) {
    baseTime *= 2
  } else if (mimeType.includes('document') || mimeType.includes('excel')) {
    baseTime *= 1.5
  }

  return Math.max(baseTime, 5) // Minimum 5 seconds
}