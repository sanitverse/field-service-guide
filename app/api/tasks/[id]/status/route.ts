import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { taskOperations } from '@/lib/database'

export async function PUT(
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
    const { status, notify = true } = await request.json()

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current task to check permissions and current status
    const { data: currentTask } = await supabase
      .from('service_tasks')
      .select('created_by, assigned_to, status')
      .eq('id', taskId)
      .single()

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user has permission to update status
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const canUpdateStatus = 
      currentTask.created_by === session.user.id ||
      currentTask.assigned_to === session.user.id ||
      ['admin', 'supervisor'].includes(userProfile?.role || '')

    if (!canUpdateStatus) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled', 'pending'],
      'completed': ['in_progress'], // Allow reopening completed tasks
      'cancelled': ['pending', 'in_progress'] // Allow reactivating cancelled tasks
    }

    if (!validTransitions[currentTask.status]?.includes(status)) {
      return NextResponse.json({ 
        error: `Cannot change status from ${currentTask.status} to ${status}` 
      }, { status: 400 })
    }

    // Update task status
    const updatedTask = await taskOperations.updateTask(
      taskId, 
      { status },
      notify
    )

    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Task status updated to ${status.replace('_', ' ')}`,
      task: updatedTask,
      previous_status: currentTask.status
    })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}