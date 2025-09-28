import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/requests/[id]/notes - Get all notes for a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    // Get notes for the request
    const { data: notes, error } = await supabase
      .from('request_notes')
      .select('*')
      .eq('request_id', resolvedParams.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      )
    }

    return NextResponse.json(notes || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/requests/[id]/notes - Add a note to a request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { note_text } = body

    // Validate input
    if (!note_text || typeof note_text !== 'string' || note_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note text is required' },
        { status: 400 }
      )
    }

    if (note_text.length > 1000) {
      return NextResponse.json(
        { error: 'Note text too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Verify request exists
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('id')
      .eq('id', resolvedParams.id)
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Create note
    const { data: newNote, error: noteError } = await supabase
      .from('request_notes')
      .insert([{
        request_id: resolvedParams.id,
        note_text: note_text.trim(),
        created_by: 'admin', // For now, all notes are created by admin
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (noteError) {
      console.error('Database error:', noteError)
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      )
    }

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}