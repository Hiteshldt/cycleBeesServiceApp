'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createRequestSchema, type CreateRequestData } from '@/lib/validations'
import { formatCurrency, rupeesToPaise, openWhatsApp, generateWhatsAppMessage, generateOrderID } from '@/lib/utils'
import { Trash2, Plus, Send, Save } from 'lucide-react'

export default function NewRequestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [shortSlug, setShortSlug] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)

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
        // Use 'draft' to align with current DB constraint
        status: 'draft',
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

  // Calculate totals (GST inclusive prices)
  const subtotalPaise = [...repairItems, ...replacementItems].reduce(
    (sum, item) => sum + (item.price_paise || 0),
    0
  )
  const totalPaise = subtotalPaise // All prices are GST inclusive

  const onSubmit = async (data: CreateRequestData) => {
    setIsLoading(true)
    try {
      // Filter out empty items and convert prices to paise
      const processedData = {
        ...data,
        repair_items: data.repair_items.filter(item => item.label.trim() && item.price_paise > 0),
        replacement_items: data.replacement_items.filter(item => item.label.trim() && item.price_paise > 0),
      }

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
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendWhatsApp = () => {
    if (!shortSlug || !phone || !customerName || !bikeName || !orderId) return
    
    const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/o/${shortSlug}`
    const message = generateWhatsAppMessage(customerName, bikeName, orderId, orderUrl)
    // Open WhatsApp (app deep link first, then web fallback)
    openWhatsApp(phone, message)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">New Service Request</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order_id">Order ID (Auto-generated)</Label>
              <Input
                id="order_id"
                {...register('request.order_id')}
                placeholder="Auto-generated"
                disabled
                className="bg-gray-100"
              />
              {errors.request?.order_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.request.order_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bike_name">Bike Name *</Label>
              <Input
                id="bike_name"
                {...register('request.bike_name')}
                placeholder="e.g., Honda Activa 6G"
              />
              {errors.request?.bike_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.request.bike_name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                {...register('request.customer_name')}
                placeholder="e.g., Rahul Kumar"
              />
              {errors.request?.customer_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.request.customer_name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">WhatsApp Number *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">+</span>
                <Input
                  id="phone"
                  {...register('request.phone_digits_intl')}
                  placeholder="7005192650"
                  className="pl-8"
                  type="tel"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number (91 will be added automatically)</p>
              {errors.request?.phone_digits_intl && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.request.phone_digits_intl.message}
                </p>
              )}
            </div>
          </div>

          {/* Repair Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Repair Services</h3>
              <Button
                type="button"
                onClick={() => appendRepair({ label: '', price_paise: 0, is_suggested: true })}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            <div className="space-y-3">
              {repairFields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`repair_${index}_label`}>Service Name</Label>
                    <Input
                      id={`repair_${index}_label`}
                      {...register(`repair_items.${index}.label` as const)}
                      placeholder="e.g., Oil Change"
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`repair_${index}_price`}>Price (₹)</Label>
                    <Controller
                      name={`repair_items.${index}.price_paise` as const}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="1"
                          placeholder="0"
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
                    size="sm"
                    variant="outline"
                    className="mb-0"
                    disabled={false}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Replacement Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Replacement Parts</h3>
              <Button
                type="button"
                onClick={() => appendReplacement({ label: '', price_paise: 0, is_suggested: true })}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </div>

            <div className="space-y-3">
              {replacementFields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`replacement_${index}_label`}>Part Name</Label>
                    <Input
                      id={`replacement_${index}_label`}
                      {...register(`replacement_items.${index}.label` as const)}
                      placeholder="e.g., Brake Pads"
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`replacement_${index}_price`}>Price (₹)</Label>
                    <Controller
                      name={`replacement_items.${index}.price_paise` as const}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="1"
                          placeholder="0"
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
                    size="sm"
                    variant="outline"
                    className="mb-0"
                    disabled={false}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal (GST Inclusive):</span>
              <span>{formatCurrency(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>La Carte Services (Fixed):</span>
              <span>{formatCurrency(9900)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
              <span>Total Amount:</span>
              <span>{formatCurrency(totalPaise + 9900)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Request'}
            </Button>

            {shortSlug && (
              <Button
                type="button"
                onClick={handleSendWhatsApp}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send on WhatsApp
              </Button>
            )}
          </div>

          {/* Success Message */}
          {shortSlug && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    Request Created Successfully!
                  </h4>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Order Link: <code className="bg-green-100 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_BASE_URL}/o/{shortSlug}
                    </code></p>
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
