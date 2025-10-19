import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PATCH /api/requests/[id]/update-whatsapp-status - Update request status after WhatsApp send
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { success, whatsappMessageId, whatsappError } = body

    // Prepare update data based on success/failure
    const updateData: any = {
      whatsapp_sent_at: new Date().toISOString(),
    }

    if (success) {
      // Success: Update to 'sent' status
      updateData.status = 'sent'
      updateData.sent_at = new Date().toISOString()
      if (whatsappMessageId) {
        updateData.whatsapp_message_id = whatsappMessageId
      }
      updateData.whatsapp_error = null // Clear any previous errors
    } else {
      // Failure: Keep as 'pending' and store error
      updateData.status = 'pending'
      updateData.whatsapp_error = whatsappError || 'Unknown error'
      updateData.whatsapp_message_id = null
    }

    // Update the request
    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating request WhatsApp status:', error)
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: success
        ? 'Request marked as sent with WhatsApp confirmation'
        : 'Request kept as pending due to WhatsApp failure',
    })
  } catch (error) {
    console.error('Error updating WhatsApp status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
