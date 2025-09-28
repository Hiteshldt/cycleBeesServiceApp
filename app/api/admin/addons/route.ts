import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/admin/addons - Get all addons
export async function GET() {
  try {
    const { data: addons, error } = await supabase
      .from('addons')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch add-ons' },
        { status: 500 }
      )
    }

    return NextResponse.json(addons)
  } catch (error) {
    console.error('Addons API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// POST /api/admin/addons - Create new addon
export async function POST(request: NextRequest) {
  try {
    const { name, description, price_paise } = await request.json()

    if (!name || !price_paise) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    // Get the highest display_order for new addon
    const { data: maxOrderData } = await supabase
      .from('addons')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1

    const { data: addon, error } = await supabase
      .from('addons')
      .insert([{
        name,
        description,
        price_paise,
        display_order: nextOrder,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create add-on' },
        { status: 500 }
      )
    }

    return NextResponse.json(addon, { status: 201 })
  } catch (error) {
    console.error('Create addon error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}