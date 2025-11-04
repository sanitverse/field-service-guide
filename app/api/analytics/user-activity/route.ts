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
    const { daysBack = 30 } = await request.json()

    // Get the current user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Only allow admin and supervisor roles to access user activity data
    if (!profile || (profile.role !== 'admin' && profile.role !== 'supervisor')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Call the database function to get user activity metrics
    const { data, error } = await supabase
      .rpc('get_user_activity_metrics', { days_back: daysBack })

    if (error) {
      console.error('Error fetching user activity metrics:', error)
      return NextResponse.json({ error: 'Failed to fetch user activity metrics' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Unexpected error in user activity API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}