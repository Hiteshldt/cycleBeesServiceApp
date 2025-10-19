'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { generateBillHTML, createBillDownload } from '@/lib/bill-generator'
import {
  getLaCartePrice,
  getLaCarteSettings,
  formatLaCarteDisplay,
  type LaCarteSettings,
} from '@/lib/lacarte'
import { openWhatsApp } from '@/lib/utils'
import { showToast } from '@/components/mobile/Toast'
import { SUPPORT_WHATSAPP_NUMBER } from '@/lib/constants'
import type { Addon, RequestItem, ServiceBundle } from '@/lib/supabase'

import type { ConfirmedData, OrderData, SelectionTotals } from '../types'

const DEFAULT_TOTALS: SelectionTotals = {
  subtotal: 0,
  addonsTotal: 0,
  bundlesTotal: 0,
  laCarteCharge: 0,
  total: 0,
}

const ACTIVE_STATUSES = new Set(['pending', 'sent', 'viewed'])

export type PublicOrderController = {
  slug: string
  orderData: OrderData | null
  addons: Addon[]
  bundles: ServiceBundle[]
  laCarte: LaCarteSettings | null
  laCartePaise: number
  selectedItems: Set<string>
  selectedAddons: Set<string>
  selectedBundles: Set<string>
  totals: SelectionTotals
  confirmedData: ConfirmedData | null
  isLoading: boolean
  isConfirming: boolean
  showConfirmation: boolean
  error: string | null
  isRedirecting: boolean
  handleConfirmOrder: () => void
  handleFinalConfirmation: () => Promise<void>
  handleNeedHelp: () => void
  handleDownloadConfirmedPDF: () => Promise<void>
  handleRetry: () => void
  openConfirmation: () => void
  closeConfirmation: () => void
  goBack: () => void
}

export function usePublicOrderController(): PublicOrderController {
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
  const [laCartePaise, setLaCartePaise] = useState<number>(9900)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const loadSelections = useCallback(() => {
    if (typeof window === 'undefined' || !slug) return

    const savedItems = window.sessionStorage.getItem(`selectedItems_${slug}`)
    const savedAddons = window.sessionStorage.getItem(`selectedAddons_${slug}`)
    const savedBundles = window.sessionStorage.getItem(`selectedBundles_${slug}`)

    if (savedItems) {
      setSelectedItems(new Set(JSON.parse(savedItems)))
    }

    if (savedAddons) {
      setSelectedAddons(new Set(JSON.parse(savedAddons)))
    }

    if (savedBundles) {
      setSelectedBundles(new Set(JSON.parse(savedBundles)))
    }
  }, [slug])

  const fetchAddons = useCallback(async () => {
    try {
      const response = await fetch('/api/addons')
      if (response.ok) {
        const data = await response.json()
        setAddons(data)
      }
    } catch (fetchError) {
      console.error('Error fetching addons:', fetchError)
    }
  }, [])

  const fetchBundles = useCallback(async () => {
    try {
      const response = await fetch('/api/bundles')
      if (response.ok) {
        const data = await response.json()
        setBundles(data)
      }
    } catch (fetchError) {
      console.error('Error fetching bundles:', fetchError)
    }
  }, [])

  const fetchOrderData = useCallback(async () => {
    if (!slug) return

    setIsLoading(true)
    setError(null)

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

      if (data.request.lacarte_paise !== null && data.request.lacarte_paise !== undefined) {
        setLaCartePaise(data.request.lacarte_paise)
      } else {
        const globalLaCarte = await getLaCartePrice()
        setLaCartePaise(globalLaCarte)
      }

      if (data.request.status === 'confirmed') {
        try {
          const confirmedResponse = await fetch(`/api/requests/${data.request.id}/confirmed`)
          if (confirmedResponse.ok) {
            const confirmedPayload = await confirmedResponse.json()
            setSelectedItems(new Set(confirmedPayload.selectedItems))
            setSelectedAddons(new Set(confirmedPayload.selectedAddons))
            setSelectedBundles(new Set(confirmedPayload.selectedBundles || []))

            const confirmedItems = data.items.filter((item: RequestItem & { selected?: boolean }) =>
              confirmedPayload.selectedItems.includes(item.id)
            )

            let addonsTotal = 0
            let bundlesTotal = 0

            if (confirmedPayload.selectedAddons.length > 0) {
              try {
                const addonsResponse = await fetch('/api/addons')
                if (addonsResponse.ok) {
                  const addonsData = await addonsResponse.json()
                  const confirmedAddons = addonsData.filter((addon: Addon) =>
                    confirmedPayload.selectedAddons.includes(addon.id)
                  )
                  addonsTotal = confirmedAddons.reduce(
                    (sum: number, addon: Addon) => sum + addon.price_paise,
                    0
                  )
                }
              } catch (addonsError) {
                console.error('Error fetching addons for total calculation:', addonsError)
              }
            }

            if (confirmedPayload.selectedBundles && confirmedPayload.selectedBundles.length > 0) {
              try {
                const bundlesResponse = await fetch('/api/bundles')
                if (bundlesResponse.ok) {
                  const bundlesData = await bundlesResponse.json()
                  const confirmedBundles = bundlesData.filter((bundle: ServiceBundle) =>
                    confirmedPayload.selectedBundles.includes(bundle.id)
                  )
                  bundlesTotal = confirmedBundles.reduce(
                    (sum: number, bundle: ServiceBundle) => sum + bundle.price_paise,
                    0
                  )
                }
              } catch (bundlesError) {
                console.error('Error fetching bundles for total calculation:', bundlesError)
              }
            }

            const subtotal = confirmedItems.reduce(
              (sum: number, item: RequestItem & { selected?: boolean }) => sum + item.price_paise,
              0
            )
            const laCarteCharge = data.request.lacarte_paise ?? (await getLaCartePrice())
            setLaCartePaise(laCarteCharge)
            const total = subtotal + addonsTotal + bundlesTotal + laCarteCharge

            setConfirmedData({
              selectedItems: confirmedPayload.selectedItems,
              selectedAddons: confirmedPayload.selectedAddons,
              selectedBundles: confirmedPayload.selectedBundles || [],
              totals: { subtotal, addonsTotal, bundlesTotal, laCarteCharge, total },
            })
          }
        } catch (confirmedError) {
          console.error('Error loading confirmed selections:', confirmedError)
        }
      } else {
        if (typeof window !== 'undefined') {
          const savedItems = window.sessionStorage.getItem(`selectedItems_${slug}`)
          if (!savedItems) {
            const suggestedItemIds = new Set<string>(
              data.items
                .filter((item: RequestItem) => item.is_suggested)
                .map((item: RequestItem) => item.id)
            )
            setSelectedItems(suggestedItemIds)
          }
        }
      }

      if (ACTIVE_STATUSES.has(data.request.status)) {
        try {
          const savedItems =
            typeof window !== 'undefined'
              ? window.sessionStorage.getItem(`selectedItems_${slug}`)
              : null

          const itemsToMark = savedItems
            ? JSON.parse(savedItems)
            : data.items
                .filter((item: RequestItem) => item.is_suggested)
                .map((item: RequestItem) => item.id)

          console.log(
            '[Main] Marking as viewed. Slug:',
            slug,
            'Status:',
            data.request.status,
            'Items count:',
            itemsToMark.length
          )

          const markResponse = await fetch(`/api/public/orders/${slug}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              selected_items: itemsToMark,
              status: 'viewed',
            }),
          })

          if (markResponse.ok) {
            console.log('[Main] Successfully marked as viewed')
            setHasViewedEstimate(true)
            setOrderData({
              ...data,
              request: { ...data.request, status: 'viewed' },
            })
          } else {
            const errorData = await markResponse.json().catch(() => ({}))
            console.error(
              '[Main] Failed to mark as viewed:',
              markResponse.status,
              markResponse.statusText,
              errorData
            )
          }
        } catch (viewError) {
          console.error('[Main] Error marking as viewed:', viewError)
        }
      }
    } catch (fetchError) {
      console.error('Error fetching order data:', fetchError)
      setError('Failed to load order details.')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  const handleRetry = useCallback(() => {
    if (!slug) return
    loadSelections()
    fetchAddons()
    fetchBundles()
    fetchOrderData()
  }, [fetchAddons, fetchBundles, fetchOrderData, loadSelections, slug])

  const totals = useMemo<SelectionTotals>(() => {
    if (!orderData) return DEFAULT_TOTALS

    const subtotal = orderData.items
      .filter((item) => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price_paise, 0)

    const addonsTotal = addons
      .filter((addon) => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price_paise, 0)

    const bundlesTotal = bundles
      .filter((bundle) => selectedBundles.has(bundle.id))
      .reduce((sum, bundle) => sum + bundle.price_paise, 0)

    const laCarteCharge = laCartePaise
    const total = subtotal + addonsTotal + bundlesTotal + laCarteCharge

    return { subtotal, addonsTotal, bundlesTotal, laCarteCharge, total }
  }, [addons, bundles, laCartePaise, orderData, selectedAddons, selectedBundles, selectedItems])

  const handleConfirmOrder = useCallback(() => {
    if (totals.total < laCartePaise) {
      showToast('Please select at least one service (La Carte included).', 'error')
      return
    }
    setShowConfirmation(true)
  }, [laCartePaise, totals.total])

  const handleNeedHelp = useCallback(() => {
    if (!orderData) return
    const supportNumberIntl = SUPPORT_WHATSAPP_NUMBER
    const message = `Hi, I need help with my service estimate for ${orderData.request.bike_name} (Order ${orderData.request.order_id}). Can you please assist me?`
    openWhatsApp(supportNumberIntl, message)
  }, [orderData])

  const handleFinalConfirmation = useCallback(async () => {
    if (!orderData) return

    setIsConfirming(true)

    try {
      await fetch(`/api/public/orders/${slug}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_items: Array.from(selectedItems),
          selected_addons: Array.from(selectedAddons),
          selected_bundles: Array.from(selectedBundles),
          status: 'confirmed',
        }),
      })

      setHasViewedEstimate(true)
      setShowConfirmation(false)
      setOrderData((prev) =>
        prev
          ? {
              ...prev,
              request: { ...prev.request, status: 'confirmed' },
            }
          : prev
      )

      setConfirmedData({
        selectedItems: Array.from(selectedItems),
        selectedAddons: Array.from(selectedAddons),
        selectedBundles: Array.from(selectedBundles),
        totals,
      })

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          `selectedItems_${slug}`,
          JSON.stringify(Array.from(selectedItems))
        )
        window.sessionStorage.setItem(
          `selectedAddons_${slug}`,
          JSON.stringify(Array.from(selectedAddons))
        )
        window.sessionStorage.setItem(
          `selectedBundles_${slug}`,
          JSON.stringify(Array.from(selectedBundles))
        )
      }

      showToast('Order confirmed successfully!', 'success')
    } catch (confirmationError) {
      console.error('Error confirming order:', confirmationError)
      showToast('Failed to confirm order. Please try again.', 'error')
    } finally {
      setIsConfirming(false)
    }
  }, [orderData, selectedAddons, selectedBundles, selectedItems, slug, totals])

  const handleDownloadConfirmedPDF = useCallback(async () => {
    if (!orderData || !confirmedData) return

    const confirmedItems = orderData.items.filter((item) =>
      confirmedData.selectedItems.includes(item.id)
    )

    const confirmedAddons = addons.filter((addon) =>
      confirmedData.selectedAddons.includes(addon.id)
    )

    const confirmedBundles = bundles.filter((bundle) =>
      (confirmedData.selectedBundles || []).includes(bundle.id)
    )

    const subtotal = confirmedItems.reduce((sum, item) => sum + item.price_paise, 0)
    const addonsTotal = confirmedAddons.reduce((sum, addon) => sum + addon.price_paise, 0)
    const bundlesTotal = confirmedBundles.reduce((sum, bundle) => sum + bundle.price_paise, 0)
    const laCarteCharge = laCartePaise
    const total = subtotal + addonsTotal + bundlesTotal + laCarteCharge

    const billData = {
      order_id: orderData.request.order_id,
      customer_name: orderData.request.customer_name,
      bike_name: orderData.request.bike_name,
      created_at: orderData.request.created_at,
      confirmed_at: new Date().toISOString(),
      items: confirmedItems,
      addons: confirmedAddons.map((addon) => ({
        name: addon.name,
        description: addon.description ?? undefined,
        price_paise: addon.price_paise,
      })),
      bundles: confirmedBundles.map((bundle) => ({
        name: bundle.name,
        description: bundle.description ?? undefined,
        price_paise: bundle.price_paise,
      })),
      subtotal_paise: subtotal,
      addons_paise: addonsTotal,
      bundles_paise: bundlesTotal,
      lacarte_paise: laCarteCharge,
      total_paise: total,
      status: 'confirmed',
    }

    const html = generateBillHTML(billData)
    const filename = `Confirmed_Order_${orderData.request.order_id}.pdf`
    createBillDownload(html, filename)
  }, [addons, bundles, confirmedData, laCartePaise, orderData])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  useEffect(() => {
    if (!slug) return
    loadSelections()
    fetchAddons()
    fetchBundles()
    fetchOrderData()
  }, [fetchAddons, fetchBundles, fetchOrderData, loadSelections, slug])

  useEffect(() => {
    async function loadLaCarteSettings() {
      try {
        const settings = await getLaCarteSettings()
        setLaCarte(settings)
      } catch (settingsError) {
        setLaCarte({
          id: 'lacarte',
          real_price_paise: 9900,
          current_price_paise: 9900,
          discount_note: '',
          is_active: true,
        })
      }
    }
    loadLaCarteSettings()
  }, [])

  useEffect(() => {
    if (!orderData || !slug) return

    if (ACTIVE_STATUSES.has(orderData.request.status)) {
      const hasSelections =
        typeof window !== 'undefined' &&
        (window.sessionStorage.getItem(`selectedItems_${slug}`) ||
          window.sessionStorage.getItem(`selectedAddons_${slug}`))

      if (!hasSelections) {
        setIsRedirecting(true)
        router.replace(`/o/${slug}/services`)
        return
      }
    }

    setIsRedirecting(false)
  }, [orderData, router, slug])

  return {
    slug,
    orderData,
    addons,
    bundles,
    laCarte,
    laCartePaise,
    selectedItems,
    selectedAddons,
    selectedBundles,
    totals,
    confirmedData,
    isLoading,
    isConfirming,
    showConfirmation,
    error,
    isRedirecting,
    handleConfirmOrder,
    handleFinalConfirmation,
    handleNeedHelp,
    handleDownloadConfirmedPDF,
    handleRetry,
    openConfirmation: () => setShowConfirmation(true),
    closeConfirmation: () => setShowConfirmation(false),
    goBack,
  }
}

export function getLaCarteDisplay(settings: LaCarteSettings | null) {
  return settings ? formatLaCarteDisplay(settings) : undefined
}
