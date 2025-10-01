import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createRequestSchema } from '@/lib/validations'

// GET /api/requests - List requests with pagination and optional status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')

    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 per page
    const offset = (validPage - 1) * validLimit

    // Build the main query for requests
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

    // Add search functionality - search across multiple fields efficiently
    if (search && search.trim()) {
      const searchTerm = search.trim()

      // Use Supabase's textSearch for efficient full-text search, or use OR conditions for partial matches
      // Search in: order_id, customer_name, bike_name, phone_digits_intl, short_slug
      query = query.or(
        `order_id.ilike.%${searchTerm}%,` +
        `customer_name.ilike.%${searchTerm}%,` +
        `bike_name.ilike.%${searchTerm}%,` +
        `phone_digits_intl.ilike.%${searchTerm}%,` +
        `short_slug.ilike.%${searchTerm}%`
      )
    }

    // Apply pagination
    query = query.range(offset, offset + validLimit - 1)

    // Get the paginated results
    const { data: requests, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    // Get total count for pagination info
    let countQuery = supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })

    // Apply same status filter for count
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    // Apply same search filter for count
    if (search && search.trim()) {
      const searchTerm = search.trim()
      countQuery = countQuery.or(
        `order_id.ilike.%${searchTerm}%,` +
        `customer_name.ilike.%${searchTerm}%,` +
        `bike_name.ilike.%${searchTerm}%,` +
        `phone_digits_intl.ilike.%${searchTerm}%,` +
        `short_slug.ilike.%${searchTerm}%`
      )
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
      return NextResponse.json(
        { error: 'Failed to get total count' },
        { status: 500 }
      )
    }

    // Add total_items count for each request
    const requestsWithCount = requests?.map(request => ({
      ...request,
      total_items: request.request_items?.length || 0,
    }))

    // Calculate pagination metadata
    const totalRequests = count || 0
    const totalPages = Math.ceil(totalRequests / validLimit)
    const hasNextPage = validPage < totalPages
    const hasPrevPage = validPage > 1

    return NextResponse.json({
      requests: requestsWithCount || [],
      pagination: {
        currentPage: validPage,
        totalPages,
        totalRequests,
        limit: validLimit,
        hasNextPage,
        hasPrevPage,
        startIndex: offset + 1,
        endIndex: Math.min(offset + validLimit, totalRequests)
      }
    })
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