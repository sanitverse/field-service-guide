import { NextRequest, NextResponse } from 'next/server'
import { deleteSavedQuery } from '@/lib/search-analytics'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { queryId: string } }
) {
  try {
    const { queryId } = params
    const { userId } = await request.json()

    if (!queryId || !userId) {
      return NextResponse.json(
        { error: 'Query ID and User ID are required' },
        { status: 400 }
      )
    }

    const success = await deleteSavedQuery(queryId, userId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete query' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Query deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting saved query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}