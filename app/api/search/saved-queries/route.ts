import { NextRequest, NextResponse } from 'next/server'
import { getSavedQueries, saveSearchQuery } from '@/lib/search-analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const queries = await getSavedQueries(userId)

    return NextResponse.json({
      success: true,
      queries,
      count: queries.length
    })

  } catch (error) {
    console.error('Error fetching saved queries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, query, filters } = await request.json()

    if (!userId || !name || !query) {
      return NextResponse.json(
        { error: 'User ID, name, and query are required' },
        { status: 400 }
      )
    }

    const savedQuery = await saveSearchQuery(userId, name, query, filters)

    if (!savedQuery) {
      return NextResponse.json(
        { error: 'Failed to save query' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      query: savedQuery
    })

  } catch (error) {
    console.error('Error saving query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}