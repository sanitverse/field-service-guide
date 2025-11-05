import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { taskOperations } from '@/lib/database'

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
    const { assignee_id, notify = true } = await request.json()

    // Verify user has permission to assign tasks
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!['admin', 'supervisor'].includes(userProfile?.role || '')) {
      // Check if user is the task creator
      const { data: task } = await supabase
        .from('service_tasks')
        .select('created_by')
        .eq('id', taskId)
        .single()

      if (!task || task.created_by !== session.user.id) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Validate assignee if provided
    if (assignee_id) {
      const { data: assignee } = await supabase
        .from('profiles')
        .select('id, role, status')
        .eq('id', assignee_id)
        .single()

      if (!assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
      }

      if (assignee.status !== 'active') {
        return NextResponse.json({ error: 'Cannot assign to inactive user' }, { status: 400 })
      }

      if (!['technician', 'supervisor', 'admin'].includes(assignee.role)) {
        return NextResponse.json({ error: 'Cannot assign to this user role' }, { status: 400 })
      }
    }

    // Update task assignment
    const updatedTask = await taskOperations.updateTask(
      taskId, 
      { assigned_to: assignee_id || null },
      notify
    )

    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to assign task' }, { status: 500 })
    }

    return NextResponse.json({
      message: assignee_id ? 'Task assigned successfully' : 'Task unassigned successfully',
      task: updatedTask
    })
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}