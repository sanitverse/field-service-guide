import { NextRequest, NextResponse } from 'next/server'
import { fileOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const processedOnly = searchParams.get('processed') === 'true'

    // Get files
    let files = await fileOperations.getFiles(taskId || undefined)

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