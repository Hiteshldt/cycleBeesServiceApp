import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/admin/lacarte - Get La Carte settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('lacarte_settings')
      .select('*')
      .eq('id', 'lacarte')
      .single()

    if (error) {
      console.error('Database error:', error)
      // Return default settings if none exist
      return NextResponse.json({
        id: 'lacarte',
        real_price_paise: 9900,
        current_price_paise: 9900,
        discount_note: '',
        is_active: true
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/lacarte - Update La Carte settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { real_price_paise, current_price_paise, discount_note } = body

    // Validate input
    if (typeof real_price_paise !== 'number' || real_price_paise < 0) {
      return NextResponse.json(
        { error: 'Invalid real price' },
        { status: 400 }
      )
    }

    if (typeof current_price_paise !== 'number' || current_price_paise < 0) {
      return NextResponse.json(
        { error: 'Invalid current price' },
        { status: 400 }
      )
    }

    const updateData = {
      real_price_paise,
      current_price_paise,
      discount_note: discount_note || '',
      updated_at: new Date().toISOString()
    }

    // Try to update existing record
    const { data, error } = await supabase
      .from('lacarte_settings')
      .update(updateData)
      .eq('id', 'lacarte')
      .select()
      .single()

    if (error) {
      // If record doesn't exist, create it
      const { data: newData, error: insertError } = await supabase
        .from('lacarte_settings')
        .insert([{
          id: 'lacarte',
          ...updateData,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to save settings' },
          { status: 500 }
        )
      }

      return NextResponse.json(newData)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}