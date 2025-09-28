import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { customerOrderSchema } from '@/lib/validations'
import { getLaCartePrice } from '@/lib/lacarte'

// POST /api/public/orders/[slug]/view - Mark order as viewed and update status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    
    // Validate input
    const validationResult = customerOrderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { selected_items, selected_addons, selected_bundles, status } = validationResult.data

    // Get order details
    const { data: orderData, error: orderError } = await supabase
      .from('requests')
      .select(`
        *,
        request_items!inner (
          id,
          section,
          label,
          price_paise
        )
      `)
      .eq('short_slug', slug)
      .in('request_items.id', selected_items)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found or invalid items selected' },
          { status: 404 }
        )
      }
      console.error('Database error:', orderError)
      return NextResponse.json(
        { error: 'Failed to fetch order details' },
        { status: 500 }
      )
    }

    // Check if order can be viewed
    if (orderData.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order has been cancelled' },
        { status: 400 }
      )
    }

    // Calculate total for selected items
    const selectedItems = orderData.request_items || []
    const subtotalPaise = selectedItems.reduce((sum: number, item: { price_paise: number }) => sum + item.price_paise, 0)
    
    // Calculate add-ons total if add-ons are selected
    let addonsTotal = 0
    if (selected_addons && selected_addons.length > 0) {
      const { data: addonsData } = await supabase
        .from('addons')
        .select('price_paise')
        .in('id', selected_addons)
      
      addonsTotal = addonsData?.reduce((sum, addon) => sum + addon.price_paise, 0) || 0
    }
    
    // Calculate bundles total if bundles are selected
    let bundlesTotal = 0
    if (selected_bundles && selected_bundles.length > 0) {
      const { data: bundlesData } = await supabase
        .from('service_bundles')
        .select('price_paise')
        .in('id', selected_bundles)
      
      bundlesTotal = bundlesData?.reduce((sum, bundle) => sum + bundle.price_paise, 0) || 0
    }
    
    const laCartePaise = await getLaCartePrice()
    const totalPaise = subtotalPaise + addonsTotal + bundlesTotal + laCartePaise

    // Determine the status to update to
    const newStatus = status || 'viewed'

    // Update request status and store the final totals
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: newStatus,
        subtotal_paise: subtotalPaise,
        tax_paise: 0, // No separate GST as prices are inclusive
        total_paise: totalPaise,
      })
      .eq('id', orderData.id)

    if (updateError) {
      console.error('Request update error:', updateError)
      // Don't fail the request if we can't update status
    }

    // If confirming the order, store the selected items, addons, and bundles
    if (newStatus === 'confirmed') {
      // Clear any previous selections for this request
      await supabase.from('confirmed_order_services').delete().eq('request_id', orderData.id)
      await supabase.from('confirmed_order_addons').delete().eq('request_id', orderData.id)
      await supabase.from('confirmed_order_bundles').delete().eq('request_id', orderData.id)

      // Store selected service items
      if (selected_items && selected_items.length > 0) {
        const serviceSelections = selected_items.map(itemId => ({
          request_id: orderData.id,
          service_item_id: itemId
        }))

        const { error: servicesError } = await supabase
          .from('confirmed_order_services')
          .insert(serviceSelections)

        if (servicesError) {
          console.error('Error storing selected services:', servicesError)
        }
      }

      // Store selected addons
      if (selected_addons && selected_addons.length > 0) {
        const addonSelections = selected_addons.map(addonId => ({
          request_id: orderData.id,
          addon_id: addonId
        }))

        const { error: addonsError } = await supabase
          .from('confirmed_order_addons')
          .insert(addonSelections)

        if (addonsError) {
          console.error('Error storing selected addons:', addonsError)
        }
      }

      // Store selected bundles
      if (selected_bundles && selected_bundles.length > 0) {
        const bundleSelections = selected_bundles.map(bundleId => ({
          request_id: orderData.id,
          bundle_id: bundleId
        }))

        const { error: bundlesError } = await supabase
          .from('confirmed_order_bundles')
          .insert(bundleSelections)

        if (bundlesError) {
          console.error('Error storing selected bundles:', bundlesError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: newStatus === 'confirmed' ? 'Order confirmed successfully' : 'Order marked as viewed',
      total_amount: totalPaise,
      currency: 'INR',
      status: newStatus,
    })

  } catch (error) {
    console.error('View API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}