import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const phone = searchParams.get('phone')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number (add 91 prefix if needed)
    let normalizedPhone = phone.trim()
    if (normalizedPhone.length === 10 && !normalizedPhone.startsWith('91')) {
      normalizedPhone = '91' + normalizedPhone
    }

    // Find request by order ID and phone number
    const { data: requestData, error } = await supabase
      .from('requests')
      .select('id, short_slug, order_id, customer_name, bike_name, status')
      .eq('order_id', orderId.trim())
      .eq('phone_digits_intl', normalizedPhone)
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
        { error: 'Failed to lookup order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      shortSlug: requestData.short_slug,
      orderId: requestData.order_id,
      customerName: requestData.customer_name,
      bikeName: requestData.bike_name,
      status: requestData.status,
    })

  } catch (error) {
    console.error('Lookup API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}