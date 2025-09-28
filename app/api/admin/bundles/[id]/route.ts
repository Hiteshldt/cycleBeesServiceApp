import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const resolvedParams = await params

    const { data: existingBundle, error: fetchError } = await supabase
      .from('service_bundles')
      .select('id')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !existingBundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    const allowedFields = ['name', 'description', 'price_paise', 'bullet_points', 'display_order', 'is_active']
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'name') {
          if (!body[field] || typeof body[field] !== 'string' || body[field].trim().length === 0) {
            return NextResponse.json(
              { error: 'Bundle name is required' },
              { status: 400 }
            )
          }
          updateData[field] = body[field].trim()
        } else if (field === 'price_paise') {
          if (typeof body[field] !== 'number' || body[field] <= 0) {
            return NextResponse.json(
              { error: 'Valid price is required' },
              { status: 400 }
            )
          }
          updateData[field] = body[field]
        } else if (field === 'bullet_points') {
          if (!Array.isArray(body[field])) {
            return NextResponse.json(
              { error: 'Bullet points must be an array' },
              { status: 400 }
            )
          }
          const validBulletPoints = body[field].filter(
            (point: any) => typeof point === 'string' && point.trim().length > 0
          )
          if (validBulletPoints.length === 0) {
            return NextResponse.json(
              { error: 'At least one valid bullet point is required' },
              { status: 400 }
            )
          }
          updateData[field] = validBulletPoints.map((point: string) => point.trim())
        } else if (field === 'description') {
          updateData[field] = body[field]?.trim() || null
        } else {
          updateData[field] = body[field]
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedBundle, error: updateError } = await supabase
      .from('service_bundles')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update bundle' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedBundle)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    const { data: existingBundle, error: fetchError } = await supabase
      .from('service_bundles')
      .select('id, name')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !existingBundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('service_bundles')
      .delete()
      .eq('id', resolvedParams.id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete bundle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Bundle deleted successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}