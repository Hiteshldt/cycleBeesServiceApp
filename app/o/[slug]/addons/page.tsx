'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Request, RequestItem, Addon, ServiceBundle } from '@/lib/supabase'
import { formatCurrency, openWhatsApp } from '@/lib/utils'
import { Check, MessageCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { getLaCarteSettings, type LaCarteSettings } from '@/lib/lacarte'

type OrderData = {
  request: Request
  items: RequestItem[]
}

export default function AddonsSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [addons, setAddons] = useState<Addon[]>([])
  const [bundles, setBundles] = useState<ServiceBundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set())
  const [laCarte, setLaCarte] = useState<LaCarteSettings | null>(null)

  const loadSelectedItems = () => {
    // Load selected items from session storage
    const savedItems = sessionStorage.getItem(`selectedItems_${slug}`)
    if (savedItems) {
      setSelectedItems(new Set(JSON.parse(savedItems)))
    } else {
      // If no saved items, redirect back to services page
      router.replace(`/o/${slug}/services`)
    }
  }

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

      // If already confirmed, redirect to summary page
      if (data.request.status === 'confirmed') {
        router.replace(`/o/${slug}`)
        return
      }
    } catch (error) {
      console.error('Error fetching order data:', error)
      setError('Failed to load order details.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAddons = async () => {
    try {
      const response = await fetch('/api/addons')
      if (response.ok) {
        const data = await response.json()
        setAddons(data)
      }
    } catch (error) {
      console.error('Error fetching addons:', error)
    }
  }

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/bundles')
      if (response.ok) {
        const data = await response.json()
        setBundles(data)
      }
    } catch (error) {
      console.error('Error fetching bundles:', error)
    }
  }

  useEffect(() => {
    if (slug) {
      fetchOrderData()
      fetchAddons()
      fetchBundles()
      loadSelectedItems()
    }
  }, [slug])

  // Load La Carte settings for visual display (no change to totals)
  useEffect(() => {
    async function loadLaCarte() {
      try {
        const settings = await getLaCarteSettings()
        setLaCarte(settings)
      } catch (e) {
        setLaCarte({ id: 'lacarte', real_price_paise: 9900, current_price_paise: 9900, discount_note: '' })
      }
    }
    loadLaCarte()
  }, [])

  const toggleAddonSelection = (addonId: string) => {
    const newSelected = new Set(selectedAddons)
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId)
    } else {
      newSelected.add(addonId)
    }
    setSelectedAddons(newSelected)
  }

  const toggleBundleSelection = (bundleId: string) => {
    // Allow only one bundle selection at a time
    if (selectedBundles.has(bundleId)) {
      // Deselect if already selected
      setSelectedBundles(new Set())
    } else {
      // Select only this bundle
      setSelectedBundles(new Set([bundleId]))
    }
  }

  const calculateTotals = () => {
    if (!orderData) return { servicesTotal: 0, addonsTotal: 0, bundlesTotal: 0, grandTotal: 0 }

    const servicesTotal = orderData.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price_paise, 0)
    
    const addonsTotal = addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price_paise, 0)
    
    const bundlesTotal = bundles
      .filter(bundle => selectedBundles.has(bundle.id))
      .reduce((sum, bundle) => sum + bundle.price_paise, 0)
    
    const laCarteCharge = 9900
    const grandTotal = servicesTotal + addonsTotal + bundlesTotal + laCarteCharge

    return { servicesTotal, addonsTotal, bundlesTotal, grandTotal }
  }

  const handleBackToServices = () => {
    router.back()
  }

  const handleProceedToConfirm = () => {
    // Store selected items, addons, and bundles for confirmation page
    sessionStorage.setItem(`selectedItems_${slug}`, JSON.stringify(Array.from(selectedItems)))
    sessionStorage.setItem(`selectedAddons_${slug}`, JSON.stringify(Array.from(selectedAddons)))
    sessionStorage.setItem(`selectedBundles_${slug}`, JSON.stringify(Array.from(selectedBundles)))
    router.push(`/o/${slug}`)
  }

  const handleNeedHelp = () => {
    if (!orderData) return
    // Support contact number: +91 95973 12212
    const supportNumberIntl = '919597312212'
    const message = `Hi, I need help with my service estimate for ${orderData.request.bike_name} (Order ${orderData.request.order_id}). Can you please assist me?`
    openWhatsApp(supportNumberIntl, message)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Add-on Services...</p>
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

  const { request } = orderData
  const totals = calculateTotals()

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
            <div className="flex items-center text-green-600">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 font-medium">Services Selected</span>
            </div>
            <div className="mx-4 w-16 h-1 bg-blue-600 rounded"></div>
            <div className="flex items-center text-blue-600">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <span className="ml-2 font-medium">Add-on Services</span>
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

        {/* Add-ons Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-yellow-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ✨ Add-on Services
          </h2>
          <p className="text-gray-600 mb-6">
            Enhance your bike maintenance with our Add-on Services. All services are optional and can be customized to your needs.
          </p>

          {addons.length > 0 ? (
            <div className="space-y-3">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedAddons.has(addon.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-yellow-300 bg-yellow-50/20'
                  }`}
                  onClick={() => toggleAddonSelection(addon.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedAddons.has(addon.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedAddons.has(addon.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{addon.name}</p>
                      {addon.description && (
                        <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(addon.price_paise)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No Add-on Services available at the moment.</p>
            </div>
          )}
        </div>

        {/* Service Bundles Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-purple-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🎁 Service Bundles
          </h2>
          <p className="text-gray-600 mb-6">
            Choose from our comprehensive service bundles that combine multiple services at discounted rates. Perfect for complete bike care.
          </p>

          {bundles.length > 0 ? (
            <div className="space-y-4">
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className={`rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedBundles.has(bundle.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 bg-purple-50/20'
                  }`}
                  onClick={() => toggleBundleSelection(bundle.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start">
                        <div
                          className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center mt-1 ${
                            selectedBundles.has(bundle.id)
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedBundles.has(bundle.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{bundle.name}</h3>
                          {bundle.description && (
                            <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(bundle.price_paise)}
                      </div>
                    </div>
                    <div className="ml-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {bundle.bullet_points.map((point, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-purple-600 mt-1 text-sm">•</span>
                            <span className="text-sm text-gray-700">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No Service Bundles available at the moment.</p>
            </div>
          )}
        </div>

        {/* Updated Total Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Selected Services ({selectedItems.size} items)</span>
              <span>{formatCurrency(totals.servicesTotal)}</span>
            </div>
            {selectedAddons.size > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Add-on Services ({selectedAddons.size} items)</span>
                <span>{formatCurrency(totals.addonsTotal)}</span>
              </div>
            )}
            {selectedBundles.size > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Service Bundles ({selectedBundles.size} items)</span>
                <span>{formatCurrency(totals.bundlesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <div className="flex flex-col">
                <span>La Carte Services (Fixed)</span>
                {laCarte && (
                  <div className="text-xs mt-1">
                    {laCarte.real_price_paise > laCarte.current_price_paise ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-400">{formatCurrency(laCarte.real_price_paise)}</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(laCarte.current_price_paise)}</span>
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded">
                          -{Math.round(((laCarte.real_price_paise - laCarte.current_price_paise) / Math.max(laCarte.real_price_paise, 1)) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">{formatCurrency(laCarte.current_price_paise)}</span>
                    )}
                    {laCarte.real_price_paise > laCarte.current_price_paise && laCarte.discount_note && (
                      <div className="text-[11px] text-gray-500 mt-0.5">{laCarte.discount_note}</div>
                    )}
                  </div>
                )}
              </div>
              <span>{formatCurrency(9900)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount (GST Inclusive)</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleProceedToConfirm}
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
            size="lg"
          >
            Proceed to Confirmation
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <Button
            onClick={handleBackToServices}
            variant="outline"
            className="w-full h-10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
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
          <p>Step 2 of 3: Choose premium add-ons to enhance your service</p>
          <p className="mt-1">Questions? Contact us on WhatsApp</p>
        </div>
      </div>
    </div>
  )
}
