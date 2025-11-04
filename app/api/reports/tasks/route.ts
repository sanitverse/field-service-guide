import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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
    const { dateRange } = await request.json()

    // Get the current user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query with date filtering if provided
    let query = supabase
      .from('service_tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        created_by,
        due_date,
        location,
        created_at,
        updated_at,
        assignee:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .order('created_at', { ascending: false })

    // Apply date range filter if provided
    if (dateRange?.from) {
      query = query.gte('created_at', dateRange.from)
    }
    if (dateRange?.to) {
      query = query.lte('created_at', dateRange.to)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks for report:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json(tasks || [])
  } catch (error) {
    console.error('Unexpected error in tasks report API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}