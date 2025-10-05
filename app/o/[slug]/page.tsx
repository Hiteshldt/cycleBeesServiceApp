'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Request, RequestItem, Addon, ServiceBundle } from '@/lib/supabase'
import { formatCurrency, openWhatsApp, formatDate } from '@/lib/utils'
import { generateBillHTML, createBillDownload } from '@/lib/bill-generator'
import { getLaCartePrice } from '@/lib/lacarte'
import { Check, MessageCircle, AlertCircle, Download } from 'lucide-react'
import { getLaCarteSettings, formatLaCarteDisplay, type LaCarteSettings } from '@/lib/lacarte'
import { AppHeader } from '@/components/mobile/AppHeader'
import { CategorySection } from '@/components/mobile/CategorySection'
import { SelectionCard } from '@/components/mobile/SelectionCard'
import { StickyActionBar } from '@/components/mobile/StickyActionBar'
import { showToast } from '@/components/mobile/Toast'

type OrderData = {
  request: Request
  items: (RequestItem & { selected?: boolean })[]
}

type ConfirmedData = {
  selectedItems: string[]
  selectedAddons: string[]
  selectedBundles: string[]
  totals: {
    subtotal: number
    addonsTotal: number
    bundlesTotal: number
    laCarteCharge: number
    total: number
  }
}

export default function PublicOrderPage() {
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
  const [hasViewedEstimate, setHasViewedEstimate] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmedData, setConfirmedData] = useState<ConfirmedData | null>(null)
  const [laCarte, setLaCarte] = useState<LaCarteSettings | null>(null)

  useEffect(() => {
    if (slug) {
      fetchOrderData()
      fetchAddons()
      fetchBundles()
      loadSelections()
    }
  }, [slug])

  // Load La Carte settings for visual display (no change to totals)
  useEffect(() => {
    async function loadLaCarte() {
      try {
        const settings = await getLaCarteSettings()
        setLaCarte(settings)
      } catch (e) {
        // Fallback silently; UI will render defaults
        setLaCarte({ id: 'lacarte', real_price_paise: 9900, current_price_paise: 9900, discount_note: '', is_active: true })
      }
    }
    loadLaCarte()
  }, [])


  const loadSelections = () => {
    // Load selections from session storage
    const savedItems = sessionStorage.getItem(`selectedItems_${slug}`)
    const savedAddons = sessionStorage.getItem(`selectedAddons_${slug}`)
    const savedBundles = sessionStorage.getItem(`selectedBundles_${slug}`)
    
    if (savedItems) {
      setSelectedItems(new Set(JSON.parse(savedItems)))
    }
    
    if (savedAddons) {
      setSelectedAddons(new Set(JSON.parse(savedAddons)))
    }
    
    if (savedBundles) {
      setSelectedBundles(new Set(JSON.parse(savedBundles)))
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

      // Pre-select all suggested items or load confirmed selections
      if (data.request.status === 'confirmed') {
        // For confirmed orders, load the actual confirmed selections
        try {
          const confirmedResponse = await fetch(`/api/requests/${data.request.id}/confirmed`)
          if (confirmedResponse.ok) {
            const confirmedData = await confirmedResponse.json()
            setSelectedItems(new Set(confirmedData.selectedItems))
            setSelectedAddons(new Set(confirmedData.selectedAddons))
            setSelectedBundles(new Set(confirmedData.selectedBundles || []))
            
            // Calculate totals directly from confirmed data (not from state which hasn't updated yet)
            const confirmedItems = data.items.filter((item: RequestItem & { selected?: boolean }) => 
              confirmedData.selectedItems.includes(item.id)
            )
            
            // We need to fetch addons and bundles to calculate totals
            let addonsTotal = 0
            let bundlesTotal = 0
            
            if (confirmedData.selectedAddons.length > 0) {
              try {
                const addonsResponse = await fetch('/api/addons')
                if (addonsResponse.ok) {
                  const addonsData = await addonsResponse.json()
                  const confirmedAddons = addonsData.filter((addon: Addon) =>
                    confirmedData.selectedAddons.includes(addon.id)
                  )
                  addonsTotal = confirmedAddons.reduce((sum: number, addon: Addon) => sum + addon.price_paise, 0)
                }
              } catch (error) {
                console.error('Error fetching addons for total calculation:', error)
              }
            }
            
            if (confirmedData.selectedBundles && confirmedData.selectedBundles.length > 0) {
              try {
                const bundlesResponse = await fetch('/api/bundles')
                if (bundlesResponse.ok) {
                  const bundlesData = await bundlesResponse.json()
                  const confirmedBundles = bundlesData.filter((bundle: ServiceBundle) =>
                    confirmedData.selectedBundles.includes(bundle.id)
                  )
                  bundlesTotal = confirmedBundles.reduce((sum: number, bundle: ServiceBundle) => sum + bundle.price_paise, 0)
                }
              } catch (error) {
                console.error('Error fetching bundles for total calculation:', error)
              }
            }
            
            const subtotal = confirmedItems.reduce((sum: number, item: RequestItem & { selected?: boolean }) => sum + item.price_paise, 0)
            const laCarteCharge = await getLaCartePrice()
            const total = subtotal + addonsTotal + bundlesTotal + laCarteCharge
            
            setConfirmedData({
              selectedItems: confirmedData.selectedItems,
              selectedAddons: confirmedData.selectedAddons,
              selectedBundles: confirmedData.selectedBundles || [],
              totals: { subtotal, addonsTotal, bundlesTotal, laCarteCharge, total }
            })
          }
        } catch (error) {
          console.error('Error loading confirmed selections:', error)
        }
      } else {
        // For non-confirmed orders, only pre-select suggested items if no selections exist in sessionStorage
        const savedItems = sessionStorage.getItem(`selectedItems_${slug}`)
        if (!savedItems) {
          // No saved selections, use suggested items
          const suggestedItemIds = new Set<string>(
            data.items.filter((item: RequestItem) => item.is_suggested).map((item: RequestItem) => item.id)
          )
          setSelectedItems(suggestedItemIds)
        }
      }

      // Mark as viewed if status is 'pending' or 'sent'
      if (data.request.status === 'pending' || data.request.status === 'sent') {
        try {
          // Use saved selections or default to suggested items for marking as viewed
          const savedItems = sessionStorage.getItem(`selectedItems_${slug}`)
          const itemsToMark = savedItems 
            ? JSON.parse(savedItems)
            : data.items.filter((item: RequestItem) => item.is_suggested).map((item: RequestItem) => item.id)
          
          await fetch(`/api/public/orders/${slug}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              selected_items: itemsToMark,
              status: 'viewed'
            }),
          })
          setHasViewedEstimate(true)
          // Update local status
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

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleAddonSelection = (addonId: string) => {
    const newSelected = new Set(selectedAddons)
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId)
    } else {
      newSelected.add(addonId)
    }
    setSelectedAddons(newSelected)
  }

  const calculateTotal = () => {
    if (!orderData) return { subtotal: 0, addonsTotal: 0, bundlesTotal: 0, laCarteCharge: 0, total: 0 }

    const subtotal = orderData.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price_paise, 0)
    
    // Calculate selected addons total
    const addonsTotal = addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price_paise, 0)
    
    // Calculate selected bundles total
    const bundlesTotal = bundles
      .filter(bundle => selectedBundles.has(bundle.id))
      .reduce((sum, bundle) => sum + bundle.price_paise, 0)
    
    // Add fixed La Carte Services charge (Ã¢â€šÂ¹99)
    const laCarteCharge = 9900 // Ã¢â€šÂ¹99 in paise
    const total = subtotal + addonsTotal + bundlesTotal + laCarteCharge

    return { subtotal, addonsTotal, bundlesTotal, laCarteCharge, total }
  }

  const handleConfirmOrder = () => {
    const totals = calculateTotal()
    if (totals.total < 9900) {
      showToast('Please select at least one service (La Carte included).', 'error')
      return
    }
    
    // Show confirmation dialog
    setShowConfirmation(true)
  }

  const handleNeedHelp = () => {
    if (!orderData) return
    // Support contact number: +91 95973 12212
    const supportNumberIntl = '919597312212'
    const message = `Hi, I need help with my service estimate for ${orderData.request.bike_name} (Order ${orderData.request.order_id}). Can you please assist me?`
    openWhatsApp(supportNumberIntl, message)
  }

  const handleFinalConfirmation = async () => {
    if (!orderData) return
    
    setIsConfirming(true)
    
    try {
      // Mark as viewed and confirmed
      await fetch(`/api/public/orders/${slug}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_items: Array.from(selectedItems),
          selected_addons: Array.from(selectedAddons),
          selected_bundles: Array.from(selectedBundles),
          status: 'confirmed'
        }),
      })
      
      // Update local state
      setHasViewedEstimate(true)
      setShowConfirmation(false)
      // Mark request as confirmed locally so UI updates without refresh
      setOrderData(prev => prev ? ({
        ...prev,
        request: { ...prev.request, status: 'confirmed' }
      }) : prev)
      
      // Store confirmed data for PDF download
      const totals = calculateTotal()
      setConfirmedData({
        selectedItems: Array.from(selectedItems),
        selectedAddons: Array.from(selectedAddons),
        selectedBundles: Array.from(selectedBundles),
        totals
      })
      // Persist selections to sessionStorage for consistency
      sessionStorage.setItem(`selectedItems_${slug}`, JSON.stringify(Array.from(selectedItems)))
      sessionStorage.setItem(`selectedAddons_${slug}`, JSON.stringify(Array.from(selectedAddons)))
      sessionStorage.setItem(`selectedBundles_${slug}`, JSON.stringify(Array.from(selectedBundles)))
      
      // Show success message
      showToast('Order confirmed successfully!', 'success')
      
    } catch (error) {
      console.error('Error confirming order:', error)
      showToast('Failed to confirm order. Please try again.', 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleDownloadConfirmedPDF = async () => {
    if (!orderData || !confirmedData) return

    // Get confirmed items data
    const confirmedItems = orderData.items.filter(item => 
      confirmedData.selectedItems.includes(item.id)
    )
    
    // Get confirmed addons data  
    const confirmedAddons = addons.filter(addon =>
      confirmedData.selectedAddons.includes(addon.id)
    )
    // Get confirmed bundles data
    const confirmedBundles = bundles.filter(bundle =>
      (confirmedData.selectedBundles || []).includes(bundle.id)
    )

    const subtotal = confirmedItems.reduce((sum, item) => sum + item.price_paise, 0)
    const addonsTotal = confirmedAddons.reduce((sum, addon) => sum + addon.price_paise, 0)
    const bundlesTotal = confirmedBundles.reduce((sum, bundle) => sum + bundle.price_paise, 0)
    const laCarteCharge = await getLaCartePrice()
    const total = subtotal + addonsTotal + bundlesTotal + laCarteCharge

    // Generate confirmed order PDF
    const billData = {

      order_id: orderData.request.order_id,
      customer_name: orderData.request.customer_name,
      bike_name: orderData.request.bike_name,
      created_at: orderData.request.created_at,
      confirmed_at: new Date().toISOString(),
      items: confirmedItems,
      addons: confirmedAddons.map(addon => ({
        name: addon.name,
        description: addon.description ?? undefined,
        price_paise: addon.price_paise
      })),
      bundles: confirmedBundles.map(bundle => ({
        name: bundle.name,
        description: bundle.description ?? undefined,
        price_paise: bundle.price_paise
      })),
      subtotal_paise: subtotal,
      addons_paise: addonsTotal,
      bundles_paise: bundlesTotal,
      lacarte_paise: laCarteCharge,
      total_paise: total,
      status: 'confirmed'
    }

    const html = generateBillHTML(billData)
    const filename = `Confirmed_Order_${orderData.request.order_id}.pdf`
    createBillDownload(html, filename)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-green-600 border-r-emerald-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-lg font-medium text-gray-800 animate-pulse">Loading Order Summary...</p>
            <p className="text-sm text-gray-600">📝 Preparing your complete order details</p>
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

  const { request, items } = orderData
  const repairItems = items.filter(item => item.section === 'repair')
  const replacementItems = items.filter(item => item.section === 'replacement')
  const totals = calculateTotal()

  // Check if order is already confirmed - show enhanced confirmed status page
  if (request.status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        {/* Enhanced App Header */}
        <AppHeader
          title="Order Confirmed"
          subtitle={`${request.bike_name} • ${request.customer_name}`}
          progress={100}
          step="Complete"
          onHelp={handleNeedHelp}
          rightSlot={
            <Badge className="bg-green-100 text-green-700 text-xs font-medium border border-green-200">
              #{request.order_id}
            </Badge>
          }
        />

        <div className="max-w-md mx-auto px-4 py-4 space-y-4">
          {/* Success Card */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-4 translate-x-4"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-2 -translate-x-2"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check className="h-8 w-8 text-green-600 animate-bounce" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Order Confirmed!</h1>
              <p className="text-white/90 text-sm">
                Thank you! Your service order is confirmed.
                <br />Our team will contact you shortly.
              </p>
            </div>
          </div>

          {/* Detailed Service Breakdown */}
          {repairItems.filter(item => selectedItems.has(item.id)).length > 0 && (
            <CategorySection
              title="Confirmed Repair Services"
              emoji="🔧"
              description="Essential fixes for your bike"
              count={repairItems.filter(item => selectedItems.has(item.id)).length}
              isCollapsible={true}
              defaultExpanded={false}
            >
              <div className="space-y-3">
                {repairItems.filter(item => selectedItems.has(item.id)).map((item) => (
                  <SelectionCard
                    key={item.id}
                    id={item.id}
                    title={item.label}
                    price={item.price_paise}
                    isSelected={true}
                    isRecommended={item.is_suggested}
                    isRequired={true}
                    type="repair"
                    onToggle={() => {}} // No-op for confirmed page
                  />
                ))}
              </div>
            </CategorySection>
          )}

          {replacementItems.filter(item => selectedItems.has(item.id)).length > 0 && (
            <CategorySection
              title="Confirmed Replacement Parts"
              emoji="⚙️"
              description="New parts for better performance"
              count={replacementItems.filter(item => selectedItems.has(item.id)).length}
              isCollapsible={true}
              defaultExpanded={false}
            >
              <div className="space-y-3">
                {replacementItems.filter(item => selectedItems.has(item.id)).map((item) => (
                  <SelectionCard
                    key={item.id}
                    id={item.id}
                    title={item.label}
                    price={item.price_paise}
                    isSelected={true}
                    isRecommended={item.is_suggested}
                    isRequired={true}
                    type="replacement"
                    onToggle={() => {}} // No-op for confirmed page
                  />
                ))}
              </div>
            </CategorySection>
          )}

          {addons.filter(addon => selectedAddons.has(addon.id)).length > 0 && (
            <CategorySection
              title="Confirmed Add-on Services"
              emoji="✨"
              description="Premium services to enhance your bike care"
              count={addons.filter(addon => selectedAddons.has(addon.id)).length}
              isCollapsible={true}
              defaultExpanded={false}
            >
              <div className="space-y-3">
                {addons.filter(addon => selectedAddons.has(addon.id)).map((addon) => (
                  <SelectionCard
                    key={addon.id}
                    id={addon.id}
                    title={addon.name}
                    description={addon.description || undefined}
                    price={addon.price_paise}
                    isSelected={true}
                    isRequired={true}
                    type="addon"
                    onToggle={() => {}} // No-op for confirmed page
                  />
                ))}
              </div>
            </CategorySection>
          )}

          {bundles.filter(bundle => selectedBundles.has(bundle.id)).length > 0 && (
            <CategorySection
              title="Confirmed Service Bundles"
              emoji="🎁"
              description="Comprehensive packages with multiple services"
              count={bundles.filter(bundle => selectedBundles.has(bundle.id)).length}
              isCollapsible={true}
              defaultExpanded={false}
            >
              <div className="space-y-3">
                {bundles.filter(bundle => selectedBundles.has(bundle.id)).map((bundle) => (
                  <SelectionCard
                    key={bundle.id}
                    id={bundle.id}
                    title={bundle.name}
                    description={bundle.description || undefined}
                    price={bundle.price_paise}
                    isSelected={true}
                    isRequired={true}
                    type="bundle"
                    bulletPoints={bundle.bullet_points}
                    onToggle={() => {}} // No-op for confirmed page
                  />
                ))}
              </div>
            </CategorySection>
          )}

          {/* La Carte Services - Always Included */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-green-900 mb-1">
                    La Carte Service (Fixed Charges - Free Services Included)
                  </h3>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {laCarte && laCarte.real_price_paise > laCarte.current_price_paise ? (
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(laCarte.current_price_paise)}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-gray-500 font-medium">MRP</span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(laCarte.real_price_paise)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(9900)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/60 rounded-lg p-3">
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
                  <span className="text-sm text-green-800">Pick & drop or doorstep service</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <CategorySection
            title="Order Summary"
            emoji="📊"
            description="Complete breakdown of confirmed services"
            isCollapsible={false}
          >
            <div className="space-y-2 text-sm">
              {totals.subtotal > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Selected Services ({selectedItems.size} items)</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
              )}
              {totals.addonsTotal > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Add-on Services ({selectedAddons.size} items)</span>
                  <span className="font-medium">{formatCurrency(totals.addonsTotal)}</span>
                </div>
              )}
              {totals.bundlesTotal > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Service Bundles ({selectedBundles.size} items)</span>
                  <span className="font-medium">{formatCurrency(totals.bundlesTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>La Carte Services (Fixed)</span>
                <span className="font-medium">{formatCurrency(laCarte?.current_price_paise || 9900)}</span>
              </div>
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Total Amount (GST Inclusive)</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </CategorySection>

          {/* Additional spacing for bottom action bar and support button */}
          <div className="h-32" />
        </div>

        {/* Sticky Action Bar */}
        <StickyActionBar
          totalPaise={totals.total}
          primaryLabel="Download Order PDF"
          onPrimary={handleDownloadConfirmedPDF}
          disabled={false}
          selectedCount={selectedItems.size + selectedAddons.size + selectedBundles.size}
          summaryText="Your order is confirmed and ready for download"
          isExpandable={true}
          servicesBreakdown={{
            selectedServicesPaise: totals.subtotal + totals.addonsTotal + totals.bundlesTotal,
            selectedCount: selectedItems.size + selectedAddons.size + selectedBundles.size,
            laCartePaise: laCarte?.current_price_paise || 9900,
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
              Need Help? Contact Us on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If order is not confirmed and no selections in session storage, redirect to services page
  if (request.status !== 'confirmed') {
    const hasSelections = sessionStorage.getItem(`selectedItems_${slug}`) ||
                         sessionStorage.getItem(`selectedAddons_${slug}`)

    if (!hasSelections) {
      router.replace(`/o/${slug}/services`)
      return null
    }
  }

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
        title="Review Your Order"
        subtitle={`${request.bike_name} • ${request.customer_name}`}
        progress={100}
        step="Step 4 of 4"
        showBack={true}
        onBack={() => router.back()}
        onHelp={handleNeedHelp}
        rightSlot={
          <Badge className="bg-white/90 text-gray-700 text-xs font-medium border">
            #{request.order_id}
          </Badge>
        }
      />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* Order Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-medium text-blue-900 mb-1">
                Service Estimate Ready
              </h2>
              <p className="text-sm text-blue-700">
                Review your selections below
              </p>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-blue-600 font-medium">Customer</p>
                <p className="text-blue-900 font-medium">{request.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Bike</p>
                <p className="text-blue-900 font-medium">{request.bike_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Repair Services */}
        {repairItems.filter(item => selectedItems.has(item.id)).length > 0 && (
          <CategorySection
            title="Repair Services"
            emoji="🔧"
            description="Selected essential fixes for your bike"
            count={repairItems.filter(item => selectedItems.has(item.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {repairItems.filter(item => selectedItems.has(item.id)).map((item) => (
                <SelectionCard
                  key={item.id}
                  id={item.id}
                  title={item.label}
                  price={item.price_paise}
                  isSelected={true}
                  isRecommended={item.is_suggested}
                  isRequired={true}
                  type="repair"
                  onToggle={() => {}} // No-op for review page
                />
              ))}
            </div>
          </CategorySection>
        )}

        {/* Selected Replacement Parts */}
        {replacementItems.filter(item => selectedItems.has(item.id)).length > 0 && (
          <CategorySection
            title="Replacement Parts"
            emoji="⚙️"
            description="Selected new parts for better performance"
            count={replacementItems.filter(item => selectedItems.has(item.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {replacementItems.filter(item => selectedItems.has(item.id)).map((item) => (
                <SelectionCard
                  key={item.id}
                  id={item.id}
                  title={item.label}
                  price={item.price_paise}
                  isSelected={true}
                  isRecommended={item.is_suggested}
                  isRequired={true}
                  type="replacement"
                  onToggle={() => {}} // No-op for review page
                />
              ))}
            </div>
          </CategorySection>
        )}

        {/* Selected Add-on Services */}
        {addons.filter(addon => selectedAddons.has(addon.id)).length > 0 && (
          <CategorySection
            title="Add-on Services"
            emoji="✨"
            description="Selected premium services to enhance your bike care"
            count={addons.filter(addon => selectedAddons.has(addon.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {addons.filter(addon => selectedAddons.has(addon.id)).map((addon) => (
                <SelectionCard
                  key={addon.id}
                  id={addon.id}
                  title={addon.name}
                  description={addon.description || undefined}
                  price={addon.price_paise}
                  isSelected={true}
                  isRequired={true}
                  type="addon"
                  onToggle={() => {}} // No-op for review page
                />
              ))}
            </div>
          </CategorySection>
        )}

        {/* Selected Service Bundles */}
        {bundles.filter(bundle => selectedBundles.has(bundle.id)).length > 0 && (
          <CategorySection
            title="Service Bundles"
            emoji="🎁"
            description="Selected comprehensive packages with multiple services"
            count={bundles.filter(bundle => selectedBundles.has(bundle.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {bundles.filter(bundle => selectedBundles.has(bundle.id)).map((bundle) => (
                <SelectionCard
                  key={bundle.id}
                  id={bundle.id}
                  title={bundle.name}
                  description={bundle.description || undefined}
                  price={bundle.price_paise}
                  isSelected={true}
                  isRequired={true}
                  type="bundle"
                  bulletPoints={bundle.bullet_points}
                  onToggle={() => {}} // No-op for review page
                />
              ))}
            </div>
          </CategorySection>
        )}

        {/* La Carte Services Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4">
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
                  <div className="text-lg font-bold text-green-700">
                    {formatCurrency(laCarte.current_price_paise)}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-500 font-medium">MRP</span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(laCarte.real_price_paise)}
                    </span>
                  </div>
                  <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold inline-block">
                    {Math.round(((laCarte.real_price_paise - laCarte.current_price_paise) / Math.max(laCarte.real_price_paise, 1)) * 100)}% off
                  </div>
                </div>
              ) : (
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(9900)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-3">
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
        totalPaise={totals.total}
        primaryLabel="Confirm Order"
        onPrimary={handleConfirmOrder}
        disabled={false}
        selectedCount={selectedItems.size + selectedAddons.size + selectedBundles.size}
        summaryText="Review and confirm your complete order"
        isExpandable={true}
        servicesBreakdown={{
          selectedServicesPaise: totals.subtotal + totals.addonsTotal + totals.bundlesTotal,
          selectedCount: selectedItems.size + selectedAddons.size + selectedBundles.size,
          laCartePaise: laCarte?.current_price_paise || 9900,
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

      {/* Enhanced Confirmation Modal */}
      {showConfirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-6 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-3 -translate-x-3"></div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Confirm Your Order
                    </h3>
                    <p className="text-white/80 text-sm">
                      Review and finalize your service package
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Order Summary with Enhanced Design */}
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Order Summary
                      </h4>
                    </div>

                    {/* Line Items */}
                    <div className="p-4 space-y-3">
                      {/* Services */}
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          <span className="text-sm text-gray-700">Selected Services ({selectedItems.size} items)</span>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(totals.subtotal)}</span>
                      </div>

                      {/* Add-ons */}
                      {selectedAddons.size > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            <span className="text-sm text-gray-700">Add-on Services ({selectedAddons.size} items)</span>
                          </div>
                          <span className="font-semibold text-gray-900">{formatCurrency(totals.addonsTotal)}</span>
                        </div>
                      )}

                      {/* Bundles */}
                      {selectedBundles.size > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            <span className="text-sm text-gray-700">Service Bundles ({selectedBundles.size} items)</span>
                          </div>
                          <span className="font-semibold text-gray-900">{formatCurrency(totals.bundlesTotal)}</span>
                        </div>
                      )}

                      {/* La Carte */}
                      <div className="flex justify-between items-start py-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span className="text-sm text-gray-700">La Carte Services</span>
                          </div>
                          {laCarte && laCarte.real_price_paise > laCarte.current_price_paise && (
                            <div className="ml-3.5 mt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs line-through text-gray-400">{formatCurrency(laCarte.real_price_paise)}</span>
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                  -{Math.round(((laCarte.real_price_paise - laCarte.current_price_paise) / Math.max(laCarte.real_price_paise, 1)) * 100)}% OFF
                                </span>
                              </div>
                              {laCarte.discount_note && (
                                <div className="text-xs text-green-600 mt-0.5">{laCarte.discount_note}</div>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(9900)}</span>
                      </div>

                      {/* Total */}
                      <div className="border-t border-gray-300 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-gray-900">Total Amount</span>
                          <span className="text-xl font-bold text-green-600">{formatCurrency(totals.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Important Notice */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-sm">⚠️</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-amber-800 mb-1">Important Notice</h5>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        This is the estimated amount for your service. Final charges may vary slightly due to additional services or parts required during the service.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    variant="outline"
                    className="flex-1 h-12 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                    disabled={isConfirming}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFinalConfirmation}
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200/50 transition-all duration-300 transform hover:scale-105"
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Confirming...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        Confirm Order
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
        </div>
      )}

    </div>
  )
}
