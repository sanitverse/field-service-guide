import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { commentOperations } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const taskId = id

    // Verify user has access to this task
    const { data: task } = await supabase
      .from('service_tasks')
      .select('created_by, assigned_to')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user has access to task comments
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const hasAccess = 
      task.created_by === session.user.id ||
      task.assigned_to === session.user.id ||
      ['admin', 'supervisor'].includes(userProfile?.role || '')

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const comments = await commentOperations.getTaskComments(taskId)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching task comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const taskId = id
    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Verify user has access to this task
    const { data: task } = await supabase
      .from('service_tasks')
      .select('created_by, assigned_to')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user has access to comment on this task
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const hasAccess = 
      task.created_by === session.user.id ||
      task.assigned_to === session.user.id ||
      ['admin', 'supervisor'].includes(userProfile?.role || '')

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const comment = await commentOperations.createComment({
      task_id: taskId,
      author_id: session.user.id,
      content: content.trim(),
    })

    if (!comment) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating task comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}