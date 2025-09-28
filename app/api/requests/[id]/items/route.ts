import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/requests/[id]/items - Get all items for a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    const { data: items, error } = await supabase
      .from('request_items')
      .select('*')
      .eq('request_id', resolvedParams.id)
      .order('section', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      )
    }

    return NextResponse.json(items || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/requests/[id]/items - Add item to request (only if request is still 'sent')
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()

    // Check if request exists and is still editable
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('status, order_id')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Prevent editing if request has been sent to customer
    if (existingRequest.status !== 'sent') {
      return NextResponse.json(
        { 
          error: `Cannot modify items for request ${existingRequest.order_id}. Request has already been sent and cannot be modified. Current status: ${existingRequest.status}`,
          code: 'REQUEST_LOCKED'
        },
        { status: 403 }
      )
    }

    // Validate item data
    const { section, label, price_paise, is_suggested = false } = body

    if (!section || !['repair', 'replacement'].includes(section)) {
      return NextResponse.json(
        { error: 'Invalid section. Must be repair or replacement' },
        { status: 400 }
      )
    }

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json(
        { error: 'Label is required' },
        { status: 400 }
      )
    }

    if (typeof price_paise !== 'number' || price_paise <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    // Create the item
    const { data: newItem, error: insertError } = await supabase
      .from('request_items')
      .insert([{
        request_id: resolvedParams.id,
        section,
        label: label.trim(),
        price_paise,
        is_suggested: Boolean(is_suggested)
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add item' },
        { status: 500 }
      )
    }

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}