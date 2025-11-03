import { NextRequest, NextResponse } from 'next/server'
import { searchDocumentChunks } from '@/lib/document-processing'

export async function POST(request: NextRequest) {
  try {
    const { query, options = {} } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Search for document chunks
    const results = await searchDocumentChunks(query.trim(), {
      matchThreshold: options.matchThreshold || 0.78,
      matchCount: options.matchCount || 10,
      fileIds: options.fileIds
    })

    return NextResponse.json({
      success: true,
      results,
      query: query.trim(),
      count: results.length
    })

  } catch (error) {
    console.error('Error in document search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const matchThreshold = parseFloat(searchParams.get('threshold') || '0.78')
    const matchCount = parseInt(searchParams.get('count') || '10')
    const fileIds = searchParams.get('fileIds')?.split(',').filter(Boolean)

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Search for document chunks
    const results = await searchDocumentChunks(query.trim(), {
      matchThreshold,
      matchCount,
      fileIds
    })

    return NextResponse.json({
      success: true,
      results,
      query: query.trim(),
      count: results.length
    })

  } catch (error) {
    console.error('Error in document search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}