import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { taskOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignee = searchParams.get('assignee')

    // Get tasks with optional filtering
    let tasks = await taskOperations.getTasks(userId || undefined)

    // Apply filters
    if (status && status !== 'all') {
      tasks = tasks.filter(task => task.status === status)
    }
    if (priority && priority !== 'all') {
      tasks = tasks.filter(task => task.priority === priority)
    }
    if (assignee && assignee !== 'all') {
      if (assignee === 'unassigned') {
        tasks = tasks.filter(task => !task.assigned_to)
      } else if (assignee === 'me') {
        tasks = tasks.filter(task => task.assigned_to === session.user.id)
      } else {
        tasks = tasks.filter(task => task.assigned_to === assignee)
      }
    }

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const taskData = {
      ...body,
      created_by: session.user.id,
    }

    const newTask = await taskOperations.createTask(taskData)
    
    if (!newTask) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}