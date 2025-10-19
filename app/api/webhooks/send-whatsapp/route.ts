import { NextRequest, NextResponse } from 'next/server'

// POST /api/webhooks/send-whatsapp - Trigger n8n to send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields (now using snake_case for template compatibility)
    const { phone, customerName, bikeName, orderId, orderKey } = body

    if (!phone || !customerName || !bikeName || !orderId || !orderKey) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, customerName, bikeName, orderId, orderKey' },
        { status: 400 }
      )
    }

    // Prepare payload for n8n template node (exact format for WhatsApp template)
    // Phone already includes country code (e.g., "917005192650")
    // WhatsApp Business API needs it with + prefix: "+917005192650"
    const n8nPayload = {
      phone: phone.startsWith('+') ? phone : `+${phone}`,
      customer_name: customerName,
      bike_name: bikeName,
      order_id: orderId,
      order_key: orderKey,
      image_url:
        'https://res.cloudinary.com/djoqfvphw/image/upload/v1760277275/whatsapp_request_promo_image_sqgzil.jpg',
    }

    // Get n8n webhook URL from environment
    const webhookUrl = process.env.N8N_WEBHOOK_URL

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured in environment variables')
      return NextResponse.json(
        { error: 'WhatsApp automation not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Call n8n webhook with timeout protection
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let webhookResponse
    try {
      webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        console.error('❌ n8n webhook timeout after 30 seconds:', { phone, orderId })
        return NextResponse.json(
          {
            error: 'WhatsApp send timeout',
            details: 'The WhatsApp service took too long to respond. Please try again.',
          },
          { status: 504 }
        )
      }

      console.error('❌ n8n webhook network error:', fetchError)
      return NextResponse.json(
        {
          error: 'Network error',
          details: 'Could not reach WhatsApp service. Please check your connection.',
        },
        { status: 503 }
      )
    }

    if (!webhookResponse.ok) {
      // Try to parse as JSON first (n8n might return structured error), fall back to text
      let errorDetails
      try {
        errorDetails = await webhookResponse.json()
      } catch {
        errorDetails = await webhookResponse.text().catch(() => 'Unknown error')
      }

      console.error('❌ n8n webhook failed:', {
        status: webhookResponse.status,
        error: errorDetails,
        phone,
        orderId,
      })

      // If errorDetails is an object with error info, extract the message
      let errorMessage = 'Failed to send WhatsApp message'
      if (typeof errorDetails === 'object' && errorDetails !== null) {
        // n8n might return WhatsApp API error in this format
        if (errorDetails.error?.message) {
          errorMessage = errorDetails.error.message
        } else if (errorDetails.message) {
          errorMessage = errorDetails.message
        }
      } else if (typeof errorDetails === 'string') {
        errorMessage = errorDetails
      }

      return NextResponse.json(
        {
          error: 'Failed to send WhatsApp message',
          details: errorMessage,
          rawError: errorDetails,
          status: webhookResponse.status,
        },
        { status: 500 }
      )
    }

    // Success response - parse n8n/WhatsApp response
    const webhookResult = await webhookResponse.json().catch(() => ({}))

    console.log('📥 n8n response received:', JSON.stringify(webhookResult, null, 2))

    // Check for various error formats that n8n might return
    let hasError = false
    let errorMessage = ''

    // Format 1: Direct error object
    if (webhookResult.error) {
      hasError = true
      errorMessage =
        webhookResult.error.message || webhookResult.error.details || 'WhatsApp send failed'
    }
    // Format 2: Error in nested structure
    else if (webhookResult.data?.error) {
      hasError = true
      errorMessage = webhookResult.data.error.message || webhookResult.data.error
    }
    // Format 3: Success flag explicitly false
    else if (webhookResult.success === false) {
      hasError = true
      errorMessage = webhookResult.message || webhookResult.error || 'WhatsApp send failed'
    }
    // Format 4: Check for WhatsApp API error codes in the response
    else if (
      webhookResult.code &&
      (webhookResult.code === 131030 || webhookResult.code === 1006 || webhookResult.code === 1008)
    ) {
      hasError = true
      errorMessage = webhookResult.message || webhookResult.error_user_msg || 'WhatsApp API error'
    }
    // Format 5: Check for error_data (WhatsApp Business API format)
    else if (
      webhookResult.error_data ||
      webhookResult.error_user_title ||
      webhookResult.error_user_msg
    ) {
      hasError = true
      errorMessage =
        webhookResult.error_user_msg || webhookResult.error_user_title || 'Recipient not available'
    }

    if (hasError) {
      console.error('❌ WhatsApp API error detected:', {
        phone,
        orderId,
        error: errorMessage,
        fullResponse: webhookResult,
      })

      // Map to user-friendly messages
      if (errorMessage.includes('not in allowed list') || errorMessage.includes('131030')) {
        errorMessage = 'This phone number is not registered on WhatsApp or not in your allowed list'
      } else if (errorMessage.includes('1006') || errorMessage.includes('not found')) {
        errorMessage = 'This phone number is not registered on WhatsApp'
      } else if (errorMessage.includes('1008') || errorMessage.includes('invalid')) {
        errorMessage = 'Invalid phone number format'
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Too many messages sent. Please wait a few minutes.'
      }

      return NextResponse.json(
        {
          error: 'Failed to send WhatsApp message',
          details: errorMessage,
          rawError: webhookResult,
        },
        { status: 500 }
      )
    }

    // Extract message ID from various possible response formats
    // n8n might return different formats depending on configuration
    let whatsappMessageId = null
    let whatsappStatus = 'sent'

    // Format 1: Direct WhatsApp API response
    if (webhookResult?.messages?.[0]?.id) {
      whatsappMessageId = webhookResult.messages[0].id
      whatsappStatus = webhookResult.messages[0].message_status || 'sent'
    }
    // Format 2: n8n custom response with messageId (camelCase)
    else if (webhookResult?.messageId) {
      whatsappMessageId = webhookResult.messageId
    }
    // Format 3: n8n custom response with messages_id (snake_case)
    else if (webhookResult?.messages_id) {
      whatsappMessageId = webhookResult.messages_id
      whatsappStatus = webhookResult.messages_status || 'sent'
    }
    // Format 4: n8n custom response with data wrapper
    else if (webhookResult?.data?.messageId) {
      whatsappMessageId = webhookResult.data.messageId
    }
    // Format 5: Check if success explicitly set to false
    else if (webhookResult?.success === false) {
      console.error('❌ n8n returned success: false without error details')
      return NextResponse.json(
        {
          error: 'Failed to send WhatsApp message',
          details: webhookResult?.message || 'Unknown error from n8n',
          rawError: webhookResult,
        },
        { status: 500 }
      )
    }

    // Log successful send with details
    console.log('✅ WhatsApp message sent successfully:', {
      phone,
      orderId,
      customerName,
      messageId: whatsappMessageId,
      status: whatsappStatus,
      fullResponse: webhookResult,
    })

    // Warning if we didn't get a message ID (might indicate incomplete n8n setup)
    if (!whatsappMessageId) {
      console.warn('⚠️ No message ID received from n8n. Response:', webhookResult)
      console.warn('⚠️ This might indicate n8n "Respond to Webhook" is not configured correctly')
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully via n8n',
      data: {
        whatsappMessageId,
        whatsappStatus,
        fullResponse: webhookResult,
      },
    })
  } catch (error) {
    console.error('Webhook API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
