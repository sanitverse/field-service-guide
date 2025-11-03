import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

    // Get file record
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check permissions - user must have access to the file
    // This includes: file uploader, task assignee/creator, admin, supervisor
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    let hasAccess = false

    // Check if user is the uploader
    if (file.uploaded_by === session.user.id) {
      hasAccess = true
    }

    // Check if user is admin or supervisor
    if (userProfile?.role === 'admin' || userProfile?.role === 'supervisor') {
      hasAccess = true
    }

    // Check if user has access to related task
    if (file.related_task_id && !hasAccess) {
      const { data: task } = await supabaseAdmin
        .from('service_tasks')
        .select('assigned_to, created_by')
        .eq('id', file.related_task_id)
        .single()

      if (task && (task.assigned_to === session.user.id || task.created_by === session.user.id)) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Create signed URL for download
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('task-files')
      .createSignedUrl(file.file_path, 300) // 5 minutes

    if (urlError || !signedUrl) {
      console.error('Error creating signed URL:', urlError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    return NextResponse.json({
      downloadUrl: signedUrl.signedUrl,
      filename: file.filename,
      mimeType: file.mime_type,
      fileSize: file.file_size
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}