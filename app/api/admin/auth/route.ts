import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Fetch admin credentials (including hashed password)
    const { data: adminData, error } = await supabase
      .from('admin_credentials')
      .select('id, username, password')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (error || !adminData) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password using bcrypt
    const isValidPassword = await verifyPassword(password, adminData.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = await generateToken({
      userId: adminData.id,
      username: adminData.username
    })

    // Return success response with JWT token
    return NextResponse.json(
      {
        success: true,
        message: 'Authentication successful',
        token
      },
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