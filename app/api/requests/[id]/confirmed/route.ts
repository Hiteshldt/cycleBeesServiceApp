import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get confirmed service selections
    const { data: confirmedServices, error: servicesError } = await supabase
      .from('confirmed_order_services')
      .select('service_item_id')
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
      .select('addon_id')
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
      .select('bundle_id')
      .eq('request_id', id)

    if (bundlesError) {
      console.error('Error fetching confirmed bundles:', bundlesError)
      return NextResponse.json(
        { error: 'Failed to fetch confirmed bundles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      selectedItems: confirmedServices?.map(s => s.service_item_id) || [],
      selectedAddons: confirmedAddons?.map(a => a.addon_id) || [],
      selectedBundles: confirmedBundles?.map(b => b.bundle_id) || [],
    })

  } catch (error) {
    console.error('Confirmed selections API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}