import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/addons - Get all active addons
export async function GET() {
  try {
    const { data: addons, error } = await supabase
      .from('addons')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch addons' },
        { status: 500 }
      )
    }

    return NextResponse.json(addons || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}