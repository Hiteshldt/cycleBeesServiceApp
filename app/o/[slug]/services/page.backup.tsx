'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Request, RequestItem } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Check, MessageCircle, AlertCircle, ArrowRight } from 'lucide-react'

type OrderData = {
  request: Request
  items: (RequestItem & { selected?: boolean })[]
}

export default function ServiceSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (slug) {
      fetchOrderData()
    }
  }, [slug])

  const fetchOrderData = async () => {
    try {
      const response = await fetch(`/api/public/orders/${slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found or has expired.')
        } else {
          setError('Failed to load order details.')
        }
        return
      }

      const data = await response.json()
      setOrderData(data)

      // Pre-select all suggested items or load confirmed selections if available
      if (data.request.status === 'confirmed') {
        try {
          const confirmedResponse = await fetch(`/api/requests/${data.request.id}/confirmed`)
          if (confirmedResponse.ok) {
            const confirmedData = await confirmedResponse.json()
            setSelectedItems(new Set(confirmedData.selectedItems))
          }
        } catch (error) {
          console.error('Error loading confirmed selections:', error)
        }
      } else {
        const suggestedItemIds = new Set<string>(
          data.items.filter((item: RequestItem) => item.is_suggested).map((item: RequestItem) => item.id)
        )
        setSelectedItems(suggestedItemIds)
      }

      // Mark as viewed if status is still sent
      if (data.request.status === 'sent') {
        try {
          await fetch(`/api/public/orders/${slug}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              selected_items: data.items.filter((item: RequestItem) => item.is_suggested).map((item: RequestItem) => item.id),
              status: 'viewed'
            }),
          })
          setOrderData({
            ...data,
            request: { ...data.request, status: 'viewed' }
          })
        } catch (error) {
          console.error('Error marking as viewed:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching order data:', error)
      setError('Failed to load order details.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const calculateServicesTotal = () => {
    if (!orderData) return 0

    return orderData.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price_paise, 0)
  }

  const handleContinueToAddons = () => {
    // Store selected items in session storage for the addons page
    sessionStorage.setItem(`selectedItems_${slug}`, JSON.stringify(Array.from(selectedItems)))
    router.push(`/o/${slug}/addons`)
  }

  const handleNeedHelp = () => {
    if (!orderData) return
    // Support contact number: +91 95973 12212 (international digits only for wa.me)
    const supportNumberIntl = '919597312212'
    const message = `Hi, I need help with my service estimate for ${orderData.request.bike_name} (Order ${orderData.request.order_id}). Can you please assist me?`
    const whatsappUrl = `https://wa.me/${supportNumberIntl}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your service estimate...</p>
        </div>
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">{error || 'Something went wrong'}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const { request, items } = orderData
  const repairItems = items.filter(item => item.section === 'repair')
  const replacementItems = items.filter(item => item.section === 'replacement')
  const servicesTotal = calculateServicesTotal()

  // Check if order is cancelled
  if (request.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Cancelled</h1>
          <p className="text-gray-600 mb-4">
            This service request has been cancelled. If you have any questions, please contact us.
          </p>
          <Button onClick={handleNeedHelp} variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Us
          </Button>
        </div>
      </div>
    )
  }

  // If already confirmed, redirect to main order page
  if (request.status === 'confirmed') {
    router.replace(`/o/${slug}`)
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CycleBees</h1>
              <p className="text-sm text-gray-600">Professional Bike Service</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Order #{request.order_id}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="flex items-center text-blue-600">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
              <span className="ml-2 font-medium">Select Services</span>
            </div>
            <div className="mx-4 w-16 h-1 bg-gray-200 rounded"></div>
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
                2
              </div>
              <span className="ml-2">Add-on Services</span>
            </div>
            <div className="mx-4 w-16 h-1 bg-gray-200 rounded"></div>
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
                3
              </div>
              <span className="ml-2">Confirm</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Service Estimate for {request.bike_name}
          </h2>
          <p className="text-gray-600 mb-4">
            Select the services and parts you want for your bike. You can customize your selection before proceeding to add-on services.
          </p>
          
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">{request.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bike</p>
              <p className="font-medium">{request.bike_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Request Created</p>
              <p className="font-medium">{formatDate(request.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium capitalize">{request.status}</p>
            </div>
          </div>
        </div>

        {/* Repair Services */}
        {repairItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-red-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Repair Services</h3>
            <div className="space-y-3">
              {repairItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedItems.has(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-red-200 bg-red-50/20'
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedItems.has(item.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedItems.has(item.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      {item.is_suggested && (
                        <p className="text-sm text-blue-600">Recommended</p>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(item.price_paise)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Replacement Parts */}
        {replacementItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔩 Replacement Parts</h3>
            <div className="space-y-3">
              {replacementItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedItems.has(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-purple-200 bg-purple-50/40'
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedItems.has(item.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedItems.has(item.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      {item.is_suggested && (
                        <p className="text-sm text-blue-600">Recommended</p>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(item.price_paise)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Total */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Selected Services ({selectedItems.size} items)</span>
              <span>{formatCurrency(servicesTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>La Carte Services (Fixed)</span>
              <span>{formatCurrency(9900)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Services Total</span>
                <span>{formatCurrency(servicesTotal + 9900)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Next: Choose add-on services to enhance your bike maintenance
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleContinueToAddons}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Continue to Add-on Services
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <Button
            onClick={handleNeedHelp}
            variant="outline"
            className="w-full h-10"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Need Help?
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Step 1 of 3: Select your desired services and continue</p>
          <p className="mt-1">Questions? Contact us on WhatsApp</p>
        </div>
      </div>
    </div>
  )
}

