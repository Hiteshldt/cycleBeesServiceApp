'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Request, RequestItem, Addon, ServiceBundle } from '@/lib/supabase'
import { formatCurrency, openWhatsApp } from '@/lib/utils'
import { MessageCircle, AlertCircle } from 'lucide-react'
import { getLaCarteSettings, formatLaCarteDisplay, type LaCarteSettings } from '@/lib/lacarte'
import { AppHeader } from '@/components/mobile/AppHeader'
import { SelectionCard } from '@/components/mobile/SelectionCard'
import { CategorySection } from '@/components/mobile/CategorySection'
import { StickyActionBar } from '@/components/mobile/StickyActionBar'

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

      // If already confirmed, redirect to main page
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
    if (!orderData) return { servicesTotal: 0, addonsTotal: 0, bundlesTotal: 0, laCarteCharge: 0, grandTotal: 0 }

    const servicesTotal = orderData.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price_paise, 0)

    const addonsTotal = addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price_paise, 0)

    const bundlesTotal = bundles
      .filter(bundle => selectedBundles.has(bundle.id))
      .reduce((sum, bundle) => sum + bundle.price_paise, 0)

    // Use request-specific La Carte price if set, otherwise global settings
    const laCarteCharge = orderData.request.lacarte_paise ?? (laCarte?.current_price_paise || 9900)
    const grandTotal = servicesTotal + addonsTotal + bundlesTotal + laCarteCharge

    return { servicesTotal, addonsTotal, bundlesTotal, laCarteCharge, grandTotal }
  }

  const handleBackToServices = () => {
    router.back()
  }

  const handleContinueToBundles = () => {
    // Store selected addons for the bundles page
    sessionStorage.setItem(`selectedAddons_${slug}`, JSON.stringify(Array.from(selectedAddons)))
    router.push(`/o/${slug}/bundles`)
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
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-purple-600 border-r-pink-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-lg font-medium text-gray-800 animate-pulse">Loading Add-on Services...</p>
            <p className="text-sm text-gray-600">✨ Preparing premium options for your bike</p>
          </div>
          {/* Loading skeleton cards */}
          <div className="mt-8 space-y-3 max-w-md mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Enhanced App Header */}
      <AppHeader
        title="Choose Add-on Services"
        subtitle={`${request.bike_name} • ${request.customer_name}`}
        progress={50}
        step="Step 2 of 4"
        showBack={true}
        onBack={handleBackToServices}
        onHelp={handleNeedHelp}
        rightSlot={
          <Badge className="bg-white/90 text-gray-700 text-xs font-medium border">
            #{request.order_id}
          </Badge>
        }
      />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* Add-ons Section */}
        {addons.length > 0 ? (
          <div className="animate-fade-in-up">
            <CategorySection
              title="Add-on Services"
              emoji="✨"
              description="Optional premium services to enhance your bike care"
              count={addons.length}
            >
              <div className="space-y-3">
                {addons.map((addon, index) => (
                  <div
                    key={addon.id}
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <SelectionCard
                      id={addon.id}
                      title={addon.name}
                      description={addon.description || undefined}
                      price={addon.price_paise}
                      isSelected={selectedAddons.has(addon.id)}
                      type="addon"
                      onToggle={toggleAddonSelection}
                    />
                  </div>
                ))}
              </div>
            </CategorySection>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center animate-fade-in">
            <div className="animate-bounce mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Add-on Services Available</h2>
            <p className="text-gray-600 mb-4">
              All add-on services are currently unavailable. You can proceed with your selected services.
            </p>
          </div>
        )}


        {/* Additional spacing for bottom action bar and support button */}
        <div className="h-32" />
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar
        totalPaise={totals.grandTotal}
        primaryLabel="Continue to Bundles"
        onPrimary={handleContinueToBundles}
        selectedCount={selectedAddons.size}
        summaryText="Next: Choose service bundles for extra savings"
        isExpandable={true}
        servicesBreakdown={{
          selectedServicesPaise: totals.servicesTotal + totals.addonsTotal,
          selectedCount: selectedItems.size + selectedAddons.size,
          laCartePaise: totals.laCarteCharge,
          laCarteDisplay: laCarte ? formatLaCarteDisplay(laCarte) : undefined
        }}
      />

      {/* Support Button Below */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 p-3">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleNeedHelp}
            variant="outline"
            className="w-full h-10 text-sm border-gray-300 text-gray-600"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Need Help?
          </Button>
        </div>
      </div>
    </div>
  )
}