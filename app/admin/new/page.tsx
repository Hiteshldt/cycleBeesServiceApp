'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createRequestSchema, type CreateRequestData } from '@/lib/validations'
import { formatCurrency, rupeesToPaise, generateOrderID } from '@/lib/utils'
import { Trash2, Plus, Send } from 'lucide-react'

export default function NewRequestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [shortSlug, setShortSlug] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingData, setPendingData] = useState<CreateRequestData | null>(null)

  // Prevent user from leaving page during critical operation
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault()
        e.returnValue = 'Request is being created. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isLoading])

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateRequestData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      request: {
        order_id: generateOrderID(),
        bike_name: '',
        customer_name: '',
        phone_digits_intl: '',
        // Set to 'pending' initially - will be updated to 'sent' after WhatsApp confirmation
        status: 'pending',
      },
      repair_items: [],
      replacement_items: [],
    },
  })

  const {
    fields: repairFields,
    append: appendRepair,
    remove: removeRepair,
  } = useFieldArray({
    control,
    name: 'repair_items',
  })

  const {
    fields: replacementFields,
    append: appendReplacement,
    remove: removeReplacement,
  } = useFieldArray({
    control,
    name: 'replacement_items',
  })

  // Watch form values to calculate totals
  const repairItems = watch('repair_items')
  const replacementItems = watch('replacement_items')
  const customerName = watch('request.customer_name')
  const bikeName = watch('request.bike_name')
  const orderId = watch('request.order_id')
  const phone = watch('request.phone_digits_intl')

  // Real-time phone validation
  const phoneDigits = phone?.replace(/\D/g, '') || ''
  const isPhoneValid = phoneDigits.length === 10
  const showPhoneError = phone && phoneDigits.length > 0 && phoneDigits.length !== 10

  // Calculate totals (GST inclusive prices)
  const subtotalPaise = [...repairItems, ...replacementItems].reduce(
    (sum, item) => sum + (item.price_paise || 0),
    0
  )
  const totalPaise = subtotalPaise // All prices are GST inclusive

  // Helper function to update status with retry logic
  const updateStatusWithRetry = async (
    requestId: string,
    statusData: { success: boolean; whatsappMessageId?: string | null; whatsappError?: string },
    maxRetries = 3
  ) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`/api/requests/${requestId}/update-whatsapp-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(statusData),
        })

        if (response.ok) {
          return await response.json()
        }

        // If not the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      } catch (error) {
        console.error(`Status update attempt ${attempt} failed:`, error)

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        } else {
          throw error
        }
      }
    }

    throw new Error('Failed to update status after maximum retries')
  }

  const onSubmit = async (data: CreateRequestData) => {
    // Show confirmation modal first
    setPendingData(data)
    setShowConfirmModal(true)
  }

  const handleConfirmAndSend = async () => {
    if (!pendingData) return

    setShowConfirmModal(false)
    setIsLoading(true)

    const data = pendingData
    try {
      // Filter out empty items and convert prices to paise
      const processedData = {
        ...data,
        repair_items: data.repair_items.filter(item => item.label.trim() && item.price_paise > 0),
        replacement_items: data.replacement_items.filter(item => item.label.trim() && item.price_paise > 0),
      }

      // Step 1: Save request to database
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData),
      })

      if (!response.ok) {
        throw new Error('Failed to create request')
      }

      const result = await response.json()
      setRequestId(result.id)
      setShortSlug(result.short_slug)

      // Step 2: Automatically send WhatsApp message via n8n webhook
      const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/o/${result.short_slug}`

      const webhookResponse = await fetch('/api/webhooks/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.request.phone_digits_intl,
          customerName: data.request.customer_name,
          bikeName: data.request.bike_name,
          orderId: data.request.order_id,
          orderUrl,
          requestId: result.id,
        }),
      })

      if (!webhookResponse.ok) {
        const errorData = await webhookResponse.json().catch(() => ({}))
        console.error('WhatsApp send failed:', errorData)

        // More specific error messages
        let errorMessage = 'Unknown error'
        if (errorData.details) {
          // Check for common WhatsApp errors
          if (errorData.details.includes('not a WhatsApp user') || errorData.details.includes('1006')) {
            errorMessage = 'This phone number is not registered on WhatsApp'
          } else if (errorData.details.includes('invalid number') || errorData.details.includes('1008')) {
            errorMessage = 'Invalid phone number format'
          } else if (errorData.details.includes('rate limit')) {
            errorMessage = 'Too many messages sent. Please wait a few minutes.'
          } else {
            errorMessage = errorData.details
          }
        } else if (errorData.error) {
          errorMessage = errorData.error
        }

        // Update request status to keep it as 'pending' with error message
        try {
          await updateStatusWithRetry(result.id, {
            success: false,
            whatsappError: errorMessage
          })
        } catch (statusUpdateError) {
          console.error('Failed to update request status after retries:', statusUpdateError)
          // Continue anyway - the request is already saved as pending by default
        }

        alert(`⚠️ Request saved as PENDING (not sent yet):\n\n${errorMessage}\n\nThe request is saved but WhatsApp was not sent. You can retry from the admin dashboard or contact the customer directly.`)
      } else {
        const successData = await webhookResponse.json().catch(() => ({}))
        console.log('WhatsApp sent successfully:', successData)

        // Show message ID if available for confirmation
        const messageId = successData?.data?.whatsappMessageId

        // Update request status to 'sent' with WhatsApp confirmation (with retry)
        try {
          await updateStatusWithRetry(result.id, {
            success: true,
            whatsappMessageId: messageId
          })
        } catch (statusUpdateError) {
          console.error('Failed to update request status after retries:', statusUpdateError)
          // WhatsApp was sent, so we'll show success but mention status update issue
          alert(`✅ WhatsApp message sent successfully!\n\n${messageId ? `Message ID: ${messageId.slice(0, 20)}...` : ''}\n\n⚠️ Note: Status update failed after multiple attempts. Please refresh the dashboard.`)
          return
        }

        if (messageId) {
          alert(`✅ Request created and WhatsApp message sent successfully!\n\nMessage ID: ${messageId.slice(0, 20)}...\n\nStatus: SENT ✅`)
        } else {
          alert('✅ Request created and WhatsApp message sent successfully!\n\nStatus: SENT ✅')
        }
      }

    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Format phone number for display
  const formatPhoneDisplay = (phone: string) => {
    // Remove any non-digits
    const digits = phone.replace(/\D/g, '')

    // If it starts with 91 and has 12 digits, format as Indian number
    if (digits.startsWith('91') && digits.length === 12) {
      const number = digits.slice(2) // Remove 91
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`
    }

    // Otherwise just show with + prefix
    return `+${digits}`
  }

  return (
    <div>
      {/* Confirmation Modal */}
      {showConfirmModal && pendingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm WhatsApp Send</h3>
              <p className="text-sm text-gray-600 mt-1">Please verify the phone number before sending</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Customer Name</p>
                  <p className="text-sm font-semibold text-gray-900">{pendingData.request.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Bike</p>
                  <p className="text-sm font-semibold text-gray-900">{pendingData.request.bike_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Order ID</p>
                  <p className="text-sm font-semibold text-gray-900">{pendingData.request.order_id}</p>
                </div>
                <div className="pt-2 border-t border-indigo-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">WhatsApp Number</p>
                  <p className="text-lg font-bold text-green-600">{formatPhoneDisplay(pendingData.request.phone_digits_intl)}</p>
                  <p className="text-xs text-gray-500 mt-1">⚠️ Please verify this number is correct</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 h-10 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmAndSend}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-10 rounded-xl flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                Confirm & Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-2">
        <div className="px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-1.5 rounded-lg">
                <div className="text-sm filter brightness-0 invert">📝</div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                New Service Request
              </h1>
              <p className="text-gray-600 text-xs">🚴‍♂️ Create a new bike service estimate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">

        <form onSubmit={handleSubmit(onSubmit)} className="p-3 space-y-3">
          {/* Compact Basic Information Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-200/50">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="order_id" className="text-gray-700 text-sm font-medium flex items-center gap-1">
                  <span>🆔</span>
                  Order ID
                </Label>
                <Input
                  id="order_id"
                  {...register('request.order_id')}
                  placeholder="Auto-generated"
                  disabled
                  className="bg-gray-100/80 border-gray-300 h-9 text-sm rounded-xl"
                />
                {errors.request?.order_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.request.order_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="bike_name" className="text-gray-700 text-sm font-medium flex items-center gap-1">
                  <span>🚴‍♂️</span>
                  Bike Name *
                </Label>
                <Input
                  id="bike_name"
                  {...register('request.bike_name')}
                  placeholder="e.g., Honda Activa 6G"
                  className="border-gray-300 h-9 text-sm rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                />
                {errors.request?.bike_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.request.bike_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="customer_name" className="text-gray-700 text-sm font-medium flex items-center gap-1">
                  <span>👤</span>
                  Customer Name *
                </Label>
                <Input
                  id="customer_name"
                  {...register('request.customer_name')}
                  placeholder="e.g., Rahul Kumar"
                  className="border-gray-300 h-9 text-sm rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                />
                {errors.request?.customer_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.request.customer_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-gray-700 text-sm font-medium flex items-center gap-1">
                  <span>📱</span>
                  WhatsApp Number *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">+</span>
                  <Input
                    id="phone"
                    {...register('request.phone_digits_intl')}
                    placeholder="7005192650"
                    className={`pl-7 h-9 text-sm rounded-xl transition-all ${
                      showPhoneError
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                    }`}
                    type="tel"
                    maxLength={15}
                  />
                </div>
                {showPhoneError ? (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    ❌ Must be exactly 10 digits (currently: {phoneDigits.length})
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-lg">
                    📝 10-digit number (91 added auto)
                  </p>
                )}
                {errors.request?.phone_digits_intl && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.request.phone_digits_intl.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Side-by-side Repair Services and Replacement Parts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Repair Services Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-200/50">
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Repair Services</h3>
                <div className="ml-auto">
                  <Button
                    type="button"
                    onClick={() => appendRepair({ label: '', price_paise: 0, is_suggested: true })}
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white h-7 px-2 text-xs rounded-xl shadow-lg transition-all duration-200"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Service
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {repairFields.map((field, index) => (
                  <div key={field.id} className="bg-red-50/50 border border-red-200/50 rounded-xl p-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`repair_${index}_label`} className="text-gray-700 text-sm font-medium flex items-center gap-1">
                          <span>🔧</span>
                          Service Name
                        </Label>
                        <Input
                          id={`repair_${index}_label`}
                          {...register(`repair_items.${index}.label` as const)}
                          placeholder="e.g., Oil Change, Brake Adjustment"
                          className="border-gray-300 h-9 text-sm rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <Label htmlFor={`repair_${index}_price`} className="text-gray-700 text-sm font-medium flex items-center gap-1">
                          <span>💰</span>
                          ₹
                        </Label>
                        <Controller
                          name={`repair_items.${index}.price_paise` as const}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              step="1"
                              placeholder="0"
                              className="border-gray-300 h-9 text-sm rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all"
                              onChange={(e) => {
                                const rupees = parseInt(e.target.value) || 0
                                field.onChange(rupeesToPaise(rupees))
                              }}
                              value={field.value ? Math.round(field.value / 100).toString() : ''}
                            />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeRepair(index)}
                        size="icon"
                        variant="outline"
                        className="!h-9 !w-9 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-xl transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {repairFields.length === 0 && (
                  <div className="text-center py-4 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-xl mb-1">🔧</div>
                    <p className="text-sm">No repair services added yet</p>
                    <p className="text-xs">Click &quot;Add Service&quot; to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Replacement Parts Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-200/50">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Replacement Parts</h3>
                <div className="ml-auto">
                  <Button
                    type="button"
                    onClick={() => appendReplacement({ label: '', price_paise: 0, is_suggested: true })}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white h-7 px-2 text-xs rounded-xl shadow-lg transition-all duration-200"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Part
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {replacementFields.map((field, index) => (
                  <div key={field.id} className="bg-purple-50/50 border border-purple-200/50 rounded-xl p-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`replacement_${index}_label`} className="text-gray-700 text-sm font-medium flex items-center gap-1">
                          <span>⚙️</span>
                          Part Name
                        </Label>
                        <Input
                          id={`replacement_${index}_label`}
                          {...register(`replacement_items.${index}.label` as const)}
                          placeholder="e.g., Brake Pads, Chain, Tire"
                          className="border-gray-300 h-9 text-sm rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <Label htmlFor={`replacement_${index}_price`} className="text-gray-700 text-sm font-medium flex items-center gap-1">
                          <span>💰</span>
                          ₹
                        </Label>
                        <Controller
                          name={`replacement_items.${index}.price_paise` as const}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              step="1"
                              placeholder="0"
                              className="border-gray-300 h-9 text-sm rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all"
                              onChange={(e) => {
                                const rupees = parseInt(e.target.value) || 0
                                field.onChange(rupeesToPaise(rupees))
                              }}
                              value={field.value ? Math.round(field.value / 100).toString() : ''}
                            />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeReplacement(index)}
                        size="icon"
                        variant="outline"
                        className="!h-9 !w-9 border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 rounded-xl transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {replacementFields.length === 0 && (
                  <div className="text-center py-4 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-xl mb-1">⚙️</div>
                    <p className="text-sm">No replacement parts added yet</p>
                    <p className="text-xs">Click &quot;Add Part&quot; to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Total Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-200/50">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">4</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Order Summary</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-gray-700 text-sm">
                <span className="flex items-center gap-1">
                  <span>🔧</span>
                  <span>Services Subtotal:</span>
                </span>
                <span className="font-semibold">{formatCurrency(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-700 text-sm">
                <span className="flex items-center gap-1">
                  <span>📦</span>
                  <span>La Carte Package:</span>
                </span>
                <span className="font-semibold">{formatCurrency(9900)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t border-gray-200 pt-2 text-gray-900">
                <span className="flex items-center gap-1">
                  <span>💰</span>
                  <span>Total Amount:</span>
                </span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(totalPaise + 9900)}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-200/50">
            <Button
              type="submit"
              disabled={isLoading || !isPhoneValid}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-8 px-3 text-xs rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3 w-3" />
              {isLoading ? 'Saving & Sending...' : 'Save & Send via WhatsApp'}
            </Button>
          </div>

          {/* Compact Success Message */}
          {shortSlug && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✅</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-green-800 mb-2">
                    🎉 Request Created Successfully!
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-200/50">
                      <p className="text-xs font-medium text-green-800 mb-1">📋 Order Details:</p>
                      <div className="space-y-0.5 text-xs text-green-700">
                        <p><strong>ID:</strong> {orderId}</p>
                        <p><strong>Customer:</strong> {customerName}</p>
                        <p><strong>Bike:</strong> {bikeName}</p>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-200/50">
                      <p className="text-xs font-medium text-green-800 mb-1">🔗 Customer Link:</p>
                      <code className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-mono break-all block">
                        {process.env.NEXT_PUBLIC_BASE_URL}/o/{shortSlug}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
