import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    console.log('📋 API: Fetching tasks...', userId ? `for user ${userId}` : 'all tasks')
    
    let query = supabaseAdmin
      .from('service_tasks')
      .select(`
        *,
        assignee:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ API: Error fetching tasks:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch tasks', 
        details: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ API: Fetched tasks:', data?.length || 0)
    
    // Log assignee information for debugging
    if (data) {
      data.forEach((task, index) => {
        if (task.assigned_to) {
          console.log(`Task ${index + 1}: ${task.title} - Assigned to: ${task.assignee?.full_name || task.assignee?.email || 'Unknown'} (ID: ${task.assigned_to})`)
        } else {
          console.log(`Task ${index + 1}: ${task.title} - Unassigned`)
        }
      })
    }
    
    return NextResponse.json({ tasks: data || [] })
    
  } catch (error) {
    console.error('❌ API: Exception fetching tasks:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch tasks', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}