import { NextRequest, NextResponse } from 'next/server'
import { fileOperations } from '@/lib/database'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('📂 Files API called')
    
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const processedOnly = searchParams.get('processed') === 'true'
    const userId = searchParams.get('userId') // Get user ID from query params
    const userRole = searchParams.get('userRole') // Get user role from query params

    console.log('Query params:', { taskId, processedOnly, userId, userRole })

    // Get files
    console.log('Calling fileOperations.getFiles...')
    let files = await fileOperations.getFiles(taskId || undefined)
    console.log('Files returned from database:', files.length)

    // Role-based filtering
    const isAdmin = userRole === 'admin'

    if (!isAdmin && userId) {
      // Supervisors and Technicians can only see their own files
      files = files.filter(file => file.uploaded_by === userId)
      console.log(`🔒 Filtered to user's own files (${userRole}): ${files.length}`)
    } else if (isAdmin) {
      console.log('👑 Admin - showing all files')
    }

    // Filter to processed files only if requested
    if (processedOnly) {
      files = files.filter(file => file.is_processed)
    }

    return NextResponse.json({
      success: true,
      files,
      count: files.length
    })

  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/files called')
    
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('Cookies available:', allCookies.map(c => c.name))
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
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
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    )
    
    // Get authenticated user - use getUser() instead of getSession()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { hasUser: !!user, authError: authError?.message })
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Authenticated user:', user.id)

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    console.log('User profile:', profile)

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get the file to check ownership and get file_path for storage deletion
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('uploaded_by, file_path, is_processed')
      .eq('id', fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check permissions: admin can delete any file, others can only delete their own
    const isAdmin = profile?.role === 'admin'
    const isOwner = file.uploaded_by === user.id

    console.log('Permission check:', { isAdmin, isOwner, fileOwner: file.uploaded_by, userId: user.id })

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this file' },
        { status: 403 }
      )
    }

    // Delete the physical file from storage first
    console.log('Deleting file from storage:', file.file_path)
    const { error: storageError } = await supabase.storage
      .from('task-files')
      .remove([file.file_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
      // The file might have already been deleted or not exist
    } else {
      console.log('✅ File deleted from storage successfully')
    }

    // Delete the database entry
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      console.error('Error deleting file from database:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    console.log('✅ File deleted from database successfully')

    // Delete document chunks if the file was processed
    if (file.is_processed) {
      console.log('Deleting document chunks for processed file')
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('file_id', fileId)

      if (chunksError) {
        console.error('Error deleting document chunks:', chunksError)
        // Don't fail the request if chunk deletion fails
      } else {
        console.log('✅ Document chunks deleted successfully')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}