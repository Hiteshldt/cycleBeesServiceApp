import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PUT /api/requests/[id]/items/[itemId] - Update item (only if request is still 'sent')
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
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
    const { section, label, price_paise, is_suggested } = body

    const updateData: any = {}
    
    if (section !== undefined) {
      if (!['repair', 'replacement'].includes(section)) {
        return NextResponse.json(
          { error: 'Invalid section. Must be repair or replacement' },
          { status: 400 }
        )
      }
      updateData.section = section
    }

    if (label !== undefined) {
      if (!label || typeof label !== 'string' || label.trim().length === 0) {
        return NextResponse.json(
          { error: 'Label is required' },
          { status: 400 }
        )
      }
      updateData.label = label.trim()
    }

    if (price_paise !== undefined) {
      if (typeof price_paise !== 'number' || price_paise <= 0) {
        return NextResponse.json(
          { error: 'Valid price is required' },
          { status: 400 }
        )
      }
      updateData.price_paise = price_paise
    }

    if (is_suggested !== undefined) {
      updateData.is_suggested = Boolean(is_suggested)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update the item
    const { data: updatedItem, error: updateError } = await supabase
      .from('request_items')
      .update(updateData)
      .eq('id', resolvedParams.itemId)
      .eq('request_id', resolvedParams.id) // Ensure item belongs to request
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      )
    }

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/requests/[id]/items/[itemId] - Delete item (only if request is still 'sent')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const resolvedParams = await params

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

    // Delete the item
    const { error: deleteError } = await supabase
      .from('request_items')
      .delete()
      .eq('id', resolvedParams.itemId)
      .eq('request_id', resolvedParams.id) // Ensure item belongs to request

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}