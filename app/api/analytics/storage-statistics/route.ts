import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

    // Get the current user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the database function to get storage statistics
    const { data, error } = await supabase
      .rpc('get_storage_statistics')

    if (error) {
      console.error('Error fetching storage statistics:', error)
      return NextResponse.json({ error: 'Failed to fetch storage statistics' }, { status: 500 })
    }

    // The function returns an array, we want the first (and only) result
    const stats = data?.[0] || {
      total_files: 0,
      total_size_bytes: 0,
      processed_files: 0,
      unprocessed_files: 0,
      avg_file_size_mb: 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Unexpected error in storage statistics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}