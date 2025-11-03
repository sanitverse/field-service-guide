import { NextRequest, NextResponse } from 'next/server'
import { updateSavedQueryUsage } from '@/lib/search-analytics'

export async function POST(
  request: NextRequest,
  { params }: { params: { queryId: string } }
) {
  try {
    const { queryId } = params

    if (!queryId) {
      return NextResponse.json(
        { error: 'Query ID is required' },
        { status: 400 }
      )
    }

    const success = await updateSavedQueryUsage(queryId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update query usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Query usage updated'
    })

  } catch (error) {
    console.error('Error updating query usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}