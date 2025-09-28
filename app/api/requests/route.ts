import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createRequestSchema } from '@/lib/validations'

// GET /api/requests - List all requests with optional status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('requests')
      .select(`
        *,
        request_items (
          id,
          section,
          label,
          price_paise
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    // Add total_items count for each request
    const requestsWithCount = requests?.map(request => ({
      ...request,
      total_items: request.request_items?.length || 0,
    }))

    return NextResponse.json(requestsWithCount || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/requests - Create a new request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validationResult = createRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { request: requestData, repair_items, replacement_items } = validationResult.data

    // Insert request into database
    const { data: newRequest, error: requestError } = await supabase
      .from('requests')
      .insert([requestData])
      .select()
      .single()

    if (requestError) {
      console.error('Request insert error:', requestError)
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      )
    }

    // Prepare items for insertion
    const allItems = [
      ...repair_items.map(item => ({
        ...item,
        request_id: newRequest.id,
        section: 'repair' as const,
      })),
      ...replacement_items.map(item => ({
        ...item,
        request_id: newRequest.id,
        section: 'replacement' as const,
      })),
    ]

    // Insert items if any exist
    if (allItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(allItems)

      if (itemsError) {
        console.error('Items insert error:', itemsError)
        // Clean up the request if items failed to insert
        await supabase.from('requests').delete().eq('id', newRequest.id)
        return NextResponse.json(
          { error: 'Failed to create request items' },
          { status: 500 }
        )
      }
    }

    // Return the created request with its short_slug
    return NextResponse.json({
      id: newRequest.id,
      short_slug: newRequest.short_slug,
      message: 'Request created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}