import { NextRequest, NextResponse } from 'next/server'
import { processDocumentForRAG } from '@/lib/document-processing'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { fileId, textContent } = await request.json()

    if (!fileId || !textContent) {
      return NextResponse.json(
        { error: 'File ID and text content are required' },
        { status: 400 }
      )
    }

    // Get file record
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Process the document
    const success = await processDocumentForRAG(fileRecord, textContent)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process document' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully'
    })

  } catch (error) {
    console.error('Error in document processing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}