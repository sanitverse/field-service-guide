import { NextRequest, NextResponse } from 'next/server'
import { trackResultClick } from '@/lib/search-analytics'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ analyticsId: string }> }
) {
  try {
    const { analyticsId } = await params
    const { resultId } = await request.json()

    if (!analyticsId || !resultId) {
      return NextResponse.json(
        { error: 'Analytics ID and Result ID are required' },
        { status: 400 }
      )
    }

    const success = await trackResultClick(analyticsId, resultId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to track result click' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Result click tracked'
    })

  } catch (error) {
    console.error('Error tracking result click:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}