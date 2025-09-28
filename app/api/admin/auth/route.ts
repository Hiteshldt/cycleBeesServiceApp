import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Check credentials against database
    const { data: adminData, error } = await supabase
      .from('admin_credentials')
      .select('id, username')
      .eq('username', username)
      .eq('password', password)
      .eq('is_active', true)
      .single()

    if (error || !adminData) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Return success response
    return NextResponse.json(
      { success: true, message: 'Authentication successful' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}