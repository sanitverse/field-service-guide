import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { processFileForRAG, reprocessFile, canProcessFileType } from '@/lib/file-processing'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params

    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file record to check permissions
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('*, uploader:profiles!files_uploaded_by_fkey(role)')
      .eq('id', fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check permissions - user must be the uploader, admin, or supervisor
    const userProfile = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const canProcess = 
      file.uploaded_by === session.user.id ||
      userProfile.data?.role === 'admin' ||
      userProfile.data?.role === 'supervisor'

    if (!canProcess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if file type can be processed
    if (!canProcessFileType(file.mime_type || '')) {
      return NextResponse.json({ 
        error: `File type ${file.mime_type} cannot be processed for RAG` 
      }, { status: 400 })
    }

    // Get processing options from request body
    const body = await request.json().catch(() => ({}))
    const { 
      reprocess = false,
      chunkSize = 1000,
      chunkOverlap = 200,
      maxChunks = 100
    } = body

    // Process the file
    const result = reprocess 
      ? await reprocessFile(fileId, { chunkSize, chunkOverlap, maxChunks })
      : await processFileForRAG(fileId, { chunkSize, chunkOverlap, maxChunks })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `File processed successfully. Generated ${result.chunks?.length || 0} chunks.`,
      chunks_count: result.chunks?.length || 0
    })
  } catch (error) {
    console.error('File processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params

    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file processing status and chunks
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('id, filename, is_processed, mime_type, file_size')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get chunks count and sample
    const { data: chunks, error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .select('id, content, chunk_index, metadata')
      .eq('file_id', fileId)
      .order('chunk_index')
      .limit(5) // Get first 5 chunks as sample

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError)
    }

    // Get total chunks count
    const { count: totalChunks } = await supabaseAdmin
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('file_id', fileId)

    return NextResponse.json({
      file: {
        id: file.id,
        filename: file.filename,
        is_processed: file.is_processed,
        mime_type: file.mime_type,
        file_size: file.file_size,
        can_process: canProcessFileType(file.mime_type || '')
      },
      processing: {
        total_chunks: totalChunks || 0,
        sample_chunks: chunks || []
      }
    })
  } catch (error) {
    console.error('Error getting processing status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}