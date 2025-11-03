import { supabase } from './supabase'
import { generateEmbedding, generateEmbeddings, chunkText, extractTextFromFile } from './openai'
import type { FileRecord, DocumentChunk } from './supabase'

/**
 * Process a document for RAG: extract text, chunk it, generate embeddings, and store
 */
export async function processDocumentForRAG(fileRecord: FileRecord, textContent: string): Promise<boolean> {
  try {
    console.log(`Processing document for RAG: ${fileRecord.filename}`)
    
    // Extract text content based on file type
    const extractedText = extractTextFromFile(textContent, fileRecord.mime_type || 'text/plain')
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.warn(`No text content found in file: ${fileRecord.filename}`)
      return false
    }

    // Split text into chunks
    const chunks = chunkText(extractedText, 1000, 100)
    
    if (chunks.length === 0) {
      console.warn(`No chunks created from file: ${fileRecord.filename}`)
      return false
    }

    console.log(`Created ${chunks.length} chunks for file: ${fileRecord.filename}`)

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks)

    // Prepare document chunks for insertion
    const documentChunks = chunks.map((chunk, index) => ({
      file_id: fileRecord.id,
      content: chunk,
      embedding: embeddings[index],
      chunk_index: index,
      metadata: {
        filename: fileRecord.filename,
        mime_type: fileRecord.mime_type,
        chunk_length: chunk.length,
        total_chunks: chunks.length,
        processed_at: new Date().toISOString()
      }
    }))

    // Insert chunks into database
    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(documentChunks)

    if (insertError) {
      console.error('Error inserting document chunks:', insertError)
      return false
    }

    // Update file record to mark as processed
    const { error: updateError } = await supabase
      .from('files')
      .update({ is_processed: true })
      .eq('id', fileRecord.id)

    if (updateError) {
      console.error('Error updating file processed status:', updateError)
      return false
    }

    console.log(`Successfully processed document: ${fileRecord.filename}`)
    return true

  } catch (error) {
    console.error('Error processing document for RAG:', error)
    return false
  }
}

/**
 * Search for similar document chunks using vector similarity
 */
export async function searchDocumentChunks(
  query: string, 
  options: {
    matchThreshold?: number
    matchCount?: number
    fileIds?: string[]
  } = {}
): Promise<Array<DocumentChunk & { similarity: number; file?: FileRecord }>> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query)

    // Use Supabase RPC function for vector similarity search
    const { data, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      match_threshold: options.matchThreshold || 0.78,
      match_count: options.matchCount || 10
    })

    if (error) {
      console.error('Error searching documents:', error)
      return []
    }

    // If file filtering is requested, apply it
    let results = data || []
    if (options.fileIds && options.fileIds.length > 0) {
      results = results.filter((result: any) => options.fileIds!.includes(result.file_id))
    }

    // Fetch file information for each result
    const resultsWithFiles = await Promise.all(
      results.map(async (result: any) => {
        const { data: fileData } = await supabase
          .from('files')
          .select('*')
          .eq('id', result.file_id)
          .single()

        return {
          id: result.id,
          file_id: result.file_id,
          content: result.content,
          embedding: null, // Don't return the embedding vector
          chunk_index: null,
          metadata: result.metadata,
          created_at: '',
          similarity: result.similarity,
          file: fileData
        }
      })
    )

    return resultsWithFiles

  } catch (error) {
    console.error('Error searching document chunks:', error)
    return []
  }
}

/**
 * Get document chunks for a specific file
 */
export async function getDocumentChunks(fileId: string): Promise<DocumentChunk[]> {
  try {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('file_id', fileId)
      .order('chunk_index')

    if (error) {
      console.error('Error fetching document chunks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching document chunks:', error)
    return []
  }
}

/**
 * Delete document chunks for a file (when file is deleted)
 */
export async function deleteDocumentChunks(fileId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .eq('file_id', fileId)

    if (error) {
      console.error('Error deleting document chunks:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting document chunks:', error)
    return false
  }
}

/**
 * Reprocess a document (regenerate chunks and embeddings)
 */
export async function reprocessDocument(fileRecord: FileRecord, textContent: string): Promise<boolean> {
  try {
    // First delete existing chunks
    await deleteDocumentChunks(fileRecord.id)

    // Then process the document again
    return await processDocumentForRAG(fileRecord, textContent)
  } catch (error) {
    console.error('Error reprocessing document:', error)
    return false
  }
}

/**
 * Get processing statistics
 */
export async function getProcessingStatistics(): Promise<{
  totalFiles: number
  processedFiles: number
  unprocessedFiles: number
  totalChunks: number
}> {
  try {
    // Get file statistics
    const { data: fileStats, error: fileError } = await supabase
      .from('files')
      .select('is_processed')

    if (fileError) {
      console.error('Error fetching file statistics:', fileError)
      return { totalFiles: 0, processedFiles: 0, unprocessedFiles: 0, totalChunks: 0 }
    }

    const totalFiles = fileStats?.length || 0
    const processedFiles = fileStats?.filter(f => f.is_processed).length || 0
    const unprocessedFiles = totalFiles - processedFiles

    // Get chunk count
    const { count: totalChunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    if (chunkError) {
      console.error('Error fetching chunk count:', chunkError)
    }

    return {
      totalFiles,
      processedFiles,
      unprocessedFiles,
      totalChunks: totalChunks || 0
    }
  } catch (error) {
    console.error('Error fetching processing statistics:', error)
    return { totalFiles: 0, processedFiles: 0, unprocessedFiles: 0, totalChunks: 0 }
  }
}