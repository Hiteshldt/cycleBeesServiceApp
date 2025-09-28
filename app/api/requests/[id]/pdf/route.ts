import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateBillHTML } from '@/lib/bill-generator'
import { getLaCartePrice } from '@/lib/lacarte'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get request details
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        request_items (*)
      `)
      .eq('id', id)
      .eq('status', 'confirmed')
      .single()

    if (requestError) {
      return NextResponse.json(
        { error: 'Confirmed order not found' },
        { status: 404 }
      )
    }

    // Get confirmed service selections
    const { data: confirmedServices, error: servicesError } = await supabase
      .from('confirmed_order_services')
      .select(`
        service_item_id,
        request_items (*)
      `)
      .eq('request_id', id)

    if (servicesError) {
      console.error('Error fetching confirmed services:', servicesError)
      return NextResponse.json(
        { error: 'Failed to fetch confirmed services' },
        { status: 500 }
      )
    }

    // Get confirmed addon selections
    const { data: confirmedAddons, error: addonsError } = await supabase
      .from('confirmed_order_addons')
      .select(`
        addon_id,
        addons (*)
      `)
      .eq('request_id', id)

    if (addonsError) {
      console.error('Error fetching confirmed addons:', addonsError)
      return NextResponse.json(
        { error: 'Failed to fetch confirmed addons' },
        { status: 500 }
      )
    }

    // Get confirmed bundle selections
    const { data: confirmedBundles, error: bundlesError } = await supabase
      .from('confirmed_order_bundles')
      .select(`
        bundle_id,
        service_bundles (*)
      `)
      .eq('request_id', id)

    if (bundlesError) {
      console.error('Error fetching confirmed bundles:', bundlesError)
      return NextResponse.json(
        { error: 'Failed to fetch confirmed bundles' },
        { status: 500 }
      )
    }

    // Process the data
    const confirmedItems = confirmedServices?.map(cs => cs.request_items).filter(Boolean).flat() || []
    const confirmedAddonsList = confirmedAddons?.map(ca => ca.addons).filter(Boolean).flat() || []
    const confirmedBundlesList = confirmedBundles?.map(cb => cb.service_bundles).filter(Boolean).flat() || []

    // Calculate totals
    const subtotal = confirmedItems.reduce((sum, item) => sum + (item?.price_paise || 0), 0)
    const addonsTotal = confirmedAddonsList.reduce((sum, addon) => sum + (addon?.price_paise || 0), 0)
    const bundlesTotal = confirmedBundlesList.reduce((sum, bundle: any) => sum + (bundle?.price_paise || 0), 0)
    const laCarteCharge = await getLaCartePrice()
    const total = subtotal + addonsTotal + bundlesTotal + laCarteCharge

    // Generate PDF data
    const billData = {
      order_id: requestData.order_id,
      customer_name: requestData.customer_name,
      bike_name: requestData.bike_name,
      created_at: requestData.created_at,
      confirmed_at: new Date().toISOString(),
      items: confirmedItems,
      addons: confirmedAddonsList,
      bundles: confirmedBundlesList,
      subtotal_paise: subtotal,
      addons_paise: addonsTotal,
      bundles_paise: bundlesTotal,
      lacarte_paise: laCarteCharge,
      total_paise: total,
      status: 'confirmed',
      isAdmin: true
    }

    const htmlContent = generateBillHTML(billData)

    // Return HTML content as a blob for client-side PDF generation
    // In a production environment, you might want to generate the PDF server-side
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="Admin_Order_${requestData.order_id}.html"`,
      },
    })

  } catch (error) {
    console.error('PDF API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
