import { NextRequest, NextResponse } from 'next/server'
import { getDocumentChunks } from '@/lib/document-processing'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get document chunks for the file
    const chunks = await getDocumentChunks(fileId)

    return NextResponse.json({
      success: true,
      chunks,
      count: chunks.length
    })

  } catch (error) {
    console.error('Error fetching document chunks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}