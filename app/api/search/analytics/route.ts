import { NextRequest, NextResponse } from 'next/server'
import { 
  trackSearchQuery, 
  getSearchHistory, 
  getSearchAnalyticsSummary,
  getPopularQueries 
} from '@/lib/search-analytics'

export async function POST(request: NextRequest) {
  try {
    const { userId, query, resultsCount, similarityThreshold, executionTimeMs } = await request.json()

    if (!userId || !query) {
      return NextResponse.json(
        { error: 'User ID and query are required' },
        { status: 400 }
      )
    }

    const analyticsId = await trackSearchQuery(
      userId,
      query,
      resultsCount || 0,
      similarityThreshold || 0.78,
      executionTimeMs || 0
    )

    return NextResponse.json({
      success: true,
      analyticsId
    })

  } catch (error) {
    console.error('Error tracking search query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'history'
    const limit = parseInt(searchParams.get('limit') || '20')
    const daysBack = parseInt(searchParams.get('daysBack') || '30')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let data

    switch (type) {
      case 'history':
        data = await getSearchHistory(userId, limit)
        break
      case 'summary':
        data = await getSearchAnalyticsSummary(userId, daysBack)
        break
      case 'popular':
        data = await getPopularQueries(limit, daysBack)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      type
    })

  } catch (error) {
    console.error('Error fetching search analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}