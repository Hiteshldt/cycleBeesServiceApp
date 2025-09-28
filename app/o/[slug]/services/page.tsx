'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Request, RequestItem } from '@/lib/supabase'
import { openWhatsApp, formatCurrency } from '@/lib/utils'
import { MessageCircle, AlertCircle, Check } from 'lucide-react'
import { getLaCarteSettings, formatLaCarteDisplay, type LaCarteSettings } from '@/lib/lacarte'
import { AppHeader } from '@/components/mobile/AppHeader'
import { SelectionCard } from '@/components/mobile/SelectionCard'
import { CategorySection } from '@/components/mobile/CategorySection'
import { StickyActionBar } from '@/components/mobile/StickyActionBar'

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
  const [laCarte, setLaCarte] = useState<LaCarteSettings | null>(null)

  useEffect(() => {
    if (slug) {
      fetchOrderData()
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
    openWhatsApp(supportNumberIntl, message)
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

  // Calculate La Carte price and create breakdown data
  const laCartePrice = laCarte?.current_price_paise || 9900
  const laCarteDisplay = laCarte ? formatLaCarteDisplay(laCarte) : undefined

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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Enhanced App Header */}
      <AppHeader
        title="Choose Your Services"
        subtitle={`${request.bike_name} • ${request.customer_name}`}
        progress={33}
        step="Step 1 of 3"
        onHelp={handleNeedHelp}
        rightSlot={
          <Badge className="bg-white/90 text-gray-700 text-xs font-medium border">
            #{request.order_id}
          </Badge>
        }
      />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* Repair Services */}
        {repairItems.length > 0 && (
          <CategorySection
            title="Repair Services"
            emoji="🔧"
            description="Essential fixes for your bike"
            count={repairItems.length}
          >
            <div className="space-y-3">
              {repairItems.map((item) => (
                <SelectionCard
                  key={item.id}
                  id={item.id}
                  title={item.label}
                  price={item.price_paise}
                  isSelected={selectedItems.has(item.id)}
                  isRecommended={item.is_suggested}
                  type="repair"
                  onToggle={toggleItemSelection}
                />
              ))}
            </div>
          </CategorySection>
        )}

        {/* Replacement Parts */}
        {replacementItems.length > 0 && (
          <CategorySection
            title="Replacement Parts"
            emoji="⚙️"
            description="New parts for better performance"
            count={replacementItems.length}
          >
            <div className="space-y-3">
              {replacementItems.map((item) => (
                <SelectionCard
                  key={item.id}
                  id={item.id}
                  title={item.label}
                  price={item.price_paise}
                  isSelected={selectedItems.has(item.id)}
                  isRecommended={item.is_suggested}
                  type="replacement"
                  onToggle={toggleItemSelection}
                />
              ))}
            </div>
          </CategorySection>
        )}

        {/* La Carte Service - Always Included */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-green-900 mb-1">
                  La Carte Service (Fixed Charges - Free Services Included below)
                </h3>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {laCarte && laCarte.real_price_paise > laCarte.current_price_paise ? (
                <div className="space-y-1">
                  {/* Discounted Price - First and Larger */}
                  <div className="text-lg font-bold text-green-700">
                    {formatCurrency(laCarte.current_price_paise)}
                  </div>

                  {/* MRP - Below Price */}
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-500 font-medium">MRP</span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(laCarte.real_price_paise)}
                    </span>
                  </div>

                  {/* Percentage Off - Below MRP */}
                  <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold inline-block">
                    {Math.round(((laCarte.real_price_paise - laCarte.current_price_paise) / Math.max(laCarte.real_price_paise, 1)) * 100)}% off
                  </div>

                  {/* Savings Amount */}
                  <div className="text-xs text-green-600 font-medium">
                    You save {formatCurrency(laCarte.real_price_paise - laCarte.current_price_paise)}!
                  </div>

                  {/* Offer Note */}
                  {laCarte.discount_note && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-400">
                      🎉 {laCarte.discount_note}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(9900)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-3 mt-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-green-800">General service & inspection report</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-green-800">Full cleaning & wash</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-green-800">Tyre puncture check & air filling</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-green-800">Oiling & lubrication service</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-green-800">Fittings & fixtures labour</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-green-800">Tightening of loose parts</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-green-800">Pick & drop or doorstep service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional spacing for bottom action bar and support button */}
        <div className="h-32" />
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar
        totalPaise={servicesTotal + laCartePrice}
        primaryLabel="Continue to Add-ons"
        onPrimary={handleContinueToAddons}
        selectedCount={selectedItems.size}
        summaryText="Next: Choose add-on services to enhance your bike maintenance"
        isExpandable={true}
        servicesBreakdown={{
          selectedServicesPaise: servicesTotal,
          selectedCount: selectedItems.size,
          laCartePaise: laCartePrice,
          laCarteDisplay: laCarteDisplay
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
