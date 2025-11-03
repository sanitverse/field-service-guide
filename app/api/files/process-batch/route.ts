import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { processFileForRAG, canProcessFileType, getProcessingStats } from '@/lib/file-processing'

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to batch process
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!userProfile || !['admin', 'supervisor'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      fileIds = [],
      processUnprocessedOnly = true,
      chunkSize = 1000,
      chunkOverlap = 200,
      maxChunks = 100
    } = body

    let filesToProcess: string[] = []

    if (fileIds.length > 0) {
      // Process specific files
      filesToProcess = fileIds
    } else if (processUnprocessedOnly) {
      // Get all unprocessed files
      const { data: unprocessedFiles, error: fetchError } = await supabaseAdmin
        .from('files')
        .select('id, mime_type')
        .eq('is_processed', false)

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch unprocessed files' }, { status: 500 })
      }

      // Filter by processable file types
      filesToProcess = unprocessedFiles
        .filter(file => canProcessFileType(file.mime_type || ''))
        .map(file => file.id)
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json({ 
        message: 'No files to process',
        processed: 0,
        failed: 0,
        results: []
      })
    }

    // Limit batch size to prevent timeouts
    const maxBatchSize = 10
    if (filesToProcess.length > maxBatchSize) {
      filesToProcess = filesToProcess.slice(0, maxBatchSize)
    }

    // Process files
    const results = []
    let processed = 0
    let failed = 0

    for (const fileId of filesToProcess) {
      try {
        const result = await processFileForRAG(fileId, { chunkSize, chunkOverlap, maxChunks })
        
        if (result.success) {
          processed++
          results.push({
            fileId,
            success: true,
            chunks: result.chunks?.length || 0
          })
        } else {
          failed++
          results.push({
            fileId,
            success: false,
            error: result.error
          })
        }
      } catch (error) {
        failed++
        results.push({
          fileId,
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        })
      }
    }

    return NextResponse.json({
      message: `Batch processing completed. ${processed} files processed, ${failed} failed.`,
      processed,
      failed,
      total: filesToProcess.length,
      results
    })
  } catch (error) {
    console.error('Batch processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get processing statistics
    const stats = await getProcessingStats()

    // Get unprocessed files that can be processed
    const { data: unprocessedFiles, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('id, filename, mime_type, file_size, created_at')
      .eq('is_processed', false)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch unprocessed files' }, { status: 500 })
    }

    const processableFiles = unprocessedFiles.filter(file => 
      canProcessFileType(file.mime_type || '')
    )

    return NextResponse.json({
      stats,
      unprocessed_files: processableFiles.length,
      unprocessed_files_list: processableFiles.slice(0, 20), // Return first 20 for preview
      total_unprocessed: unprocessedFiles.length
    })
  } catch (error) {
    console.error('Error getting batch processing status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}