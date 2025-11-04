import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    const { dateRange, period } = await request.json()
    const { type } = await params

    // Get the current user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'tasks':
        csvContent = await exportTasks(supabase, user.id, dateRange)
        filename = 'tasks-export.csv'
        break
      
      case 'users':
        // Check if user has permission to export user data
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || (profile.role !== 'admin' && profile.role !== 'supervisor')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        csvContent = await exportUsers(supabase, period)
        filename = 'users-export.csv'
        break
      
      case 'files':
        csvContent = await exportFiles(supabase, user.id, dateRange)
        filename = 'files-export.csv'
        break
      
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error in export API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function exportTasks(supabase: any, userId: string, dateRange: any) {
  const { data: tasks, error } = await supabase
    .from('service_tasks')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      location,
      due_date,
      created_at,
      updated_at,
      assignee:assigned_to(full_name, email),
      creator:created_by(full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch tasks for export')
  }

  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Location',
    'Assigned To',
    'Created By',
    'Due Date',
    'Created At',
    'Updated At'
  ]

  const rows = tasks.map((task: any) => [
    task.id,
    `"${task.title || ''}"`,
    `"${task.description || ''}"`,
    task.status,
    task.priority,
    `"${task.location || ''}"`,
    `"${task.assignee?.full_name || ''}"`,
    `"${task.creator?.full_name || ''}"`,
    task.due_date || '',
    task.created_at,
    task.updated_at
  ])

  return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n')
}

async function exportUsers(supabase: any, period: string) {
  const { data: userMetrics, error } = await supabase
    .rpc('get_user_activity_metrics', { days_back: parseInt(period) })

  if (error) {
    throw new Error('Failed to fetch user metrics for export')
  }

  const headers = [
    'User ID',
    'Full Name',
    'Role',
    'Tasks Created',
    'Tasks Completed',
    'Files Uploaded',
    'AI Interactions',
    'Total Activity'
  ]

  const rows = userMetrics.map((user: any) => [
    user.user_id,
    `"${user.full_name || ''}"`,
    user.role,
    user.tasks_created,
    user.tasks_completed,
    user.files_uploaded,
    user.ai_interactions,
    user.tasks_created + user.tasks_completed + user.files_uploaded + user.ai_interactions
  ])

  return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n')
}

async function exportFiles(supabase: any, userId: string, dateRange: any) {
  const { data: files, error } = await supabase
    .from('files')
    .select(`
      id,
      filename,
      file_size,
      mime_type,
      is_processed,
      created_at,
      uploader:uploaded_by(full_name, email),
      task:related_task_id(title)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch files for export')
  }

  const headers = [
    'ID',
    'Filename',
    'File Size (bytes)',
    'MIME Type',
    'Processed',
    'Uploaded By',
    'Related Task',
    'Created At'
  ]

  const rows = files.map((file: any) => [
    file.id,
    `"${file.filename || ''}"`,
    file.file_size || 0,
    `"${file.mime_type || ''}"`,
    file.is_processed ? 'Yes' : 'No',
    `"${file.uploader?.full_name || ''}"`,
    `"${file.task?.title || ''}"`,
    file.created_at
  ])

  return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n')
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}