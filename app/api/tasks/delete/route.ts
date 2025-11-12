import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }
    
    console.log('🗑️ API: Deleting task:', taskId)
    
    // First, delete related comments (if any)
    const { error: commentsError } = await supabaseAdmin
      .from('task_comments')
      .delete()
      .eq('task_id', taskId)
    
    if (commentsError) {
      console.log('⚠️ Error deleting comments (may not exist):', commentsError)
      // Don't fail here, comments might not exist
    }
    
    // Then delete the task
    const { error: taskError } = await supabaseAdmin
      .from('service_tasks')
      .delete()
      .eq('id', taskId)
    
    if (taskError) {
      console.error('❌ API: Error deleting task:', taskError)
      return NextResponse.json({ 
        error: 'Failed to delete task', 
        details: taskError.message 
      }, { status: 500 })
    }
    
    console.log('✅ API: Task deleted successfully')
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('❌ API: Exception deleting task:', error)
    return NextResponse.json({ 
      error: 'Failed to delete task', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}