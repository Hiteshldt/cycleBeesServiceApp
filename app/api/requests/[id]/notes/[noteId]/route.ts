import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PUT /api/requests/[id]/notes/[noteId] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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

    // Update note
    const { data: updatedNote, error } = await supabase
      .from('request_notes')
      .update({
        note_text: note_text.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.noteId)
      .eq('request_id', resolvedParams.id) // Ensure note belongs to the request
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update note' },
        { status: 500 }
      )
    }

    if (!updatedNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/requests/[id]/notes/[noteId] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const resolvedParams = await params

    // Delete note
    const { error } = await supabase
      .from('request_notes')
      .delete()
      .eq('id', resolvedParams.noteId)
      .eq('request_id', resolvedParams.id) // Ensure note belongs to the request

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}