import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: bundles, error } = await supabase
      .from('service_bundles')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bundles' },
        { status: 500 }
      )
    }

    return NextResponse.json(bundles || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price_paise, bullet_points, display_order } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Bundle name is required' },
        { status: 400 }
      )
    }

    if (typeof price_paise !== 'number' || price_paise <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(bullet_points) || bullet_points.length === 0) {
      return NextResponse.json(
        { error: 'At least one bullet point is required' },
        { status: 400 }
      )
    }

    const validBulletPoints = bullet_points.filter(
      point => typeof point === 'string' && point.trim().length > 0
    )

    if (validBulletPoints.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid bullet point is required' },
        { status: 400 }
      )
    }

    const { data: newBundle, error: insertError } = await supabase
      .from('service_bundles')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
        price_paise,
        bullet_points: validBulletPoints.map(point => point.trim()),
        display_order: display_order || 0,
        is_active: true
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create bundle' },
        { status: 500 }
      )
    }

    return NextResponse.json(newBundle, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}