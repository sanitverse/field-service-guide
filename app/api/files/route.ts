import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { validateFile, generateSafeFilename } from '@/lib/file-validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabaseAdmin
      .from('files')
      .select(`
        *,
        uploader:profiles!files_uploaded_by_fkey(id, full_name, email),
        related_task:service_tasks(id, title)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (taskId) {
      query = query.eq('related_task_id', taskId)
    }

    if (userId) {
      query = query.eq('uploaded_by', userId)
    }

    const { data: files, error } = await query

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const relatedTaskId = formData.get('relatedTaskId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Generate safe filename
    const filePath = generateSafeFilename(file.name, session.user.id)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('task-files')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('files')
      .insert({
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: session.user.id,
        related_task_id: relatedTaskId || null
      })
      .select(`
        *,
        uploader:profiles!files_uploaded_by_fkey(id, full_name, email)
      `)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await supabaseAdmin.storage.from('task-files').remove([filePath])
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
    }

    return NextResponse.json({ file: fileRecord }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file record to check permissions and get file path
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

    const canDelete = 
      file.uploaded_by === session.user.id ||
      userProfile.data?.role === 'admin' ||
      userProfile.data?.role === 'supervisor'

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('task-files')
      .remove([file.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database (this will cascade to document_chunks)
    const { error: dbError } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}