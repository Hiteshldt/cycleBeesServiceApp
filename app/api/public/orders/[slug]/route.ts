import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/public/orders/[slug] - Get order details for public viewing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { data: orderData, error } = await supabase
      .from('requests')
      .select(`
        *,
        request_items (
          id,
          section,
          label,
          price_paise,
          is_suggested
        )
      `)
      .eq('short_slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    // Return order data with items grouped by section
    return NextResponse.json({
      request: orderData,
      items: orderData.request_items || [],
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}