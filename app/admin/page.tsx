'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { Request, RequestItem } from '@/lib/supabase'
import { formatCurrency, formatDate, getStatusColor, openWhatsApp, generateWhatsAppMessage } from '@/lib/utils'
import { NotificationManager, StatusChangeDetector } from '@/lib/notification'
import { Modal } from '@/components/ui/modal'
import { BillPreview } from '@/components/BillPreview'
import { getLaCartePrice } from '@/lib/lacarte'
import { Eye, Send, Copy, Filter, Download, Bell, BellOff, Trash2, FileText, X, Search } from 'lucide-react'
import { DownloadModal, type DownloadOptions } from '@/components/DownloadModal'

type RequestWithTotal = Request & {
  total_items: number
  request_items?: RequestItem[]
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalRequests: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startIndex: number
  endIndex: number
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestWithTotal[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    limit: 30,
    hasNextPage: false,
    hasPrevPage: false,
    startIndex: 1,
    endIndex: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isPaginationLoading, setIsPaginationLoading] = useState(false)
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null)
  const [loadingNewRequest, setLoadingNewRequest] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [downloadModal, setDownloadModal] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    billData: any
    title: string
  }>({
    isOpen: false,
    billData: null,
    title: ''
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  // Notification system refs
  const notificationManager = useRef<NotificationManager | null>(null)
  const statusDetector = useRef<StatusChangeDetector | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  const fetchRequests = async (page?: number, showPaginationLoading = false) => {
    try {
      // Set loading states
      if (showPaginationLoading) {
        setIsPaginationLoading(true)
      }

      // Get current page from URL params or use provided page
      const currentPage = page || parseInt(searchParams.get('page') || '1')

      // Build URL with pagination, status filter, and search
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', '30')
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (searchQuery && searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const url = `/api/requests?${params.toString()}`

      console.log('Fetching requests from:', url)
      const response = await fetch(url)
      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received data:', data)

      // Update state with paginated results
      setRequests(data.requests || [])
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRequests: 0,
        limit: 30,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 1,
        endIndex: 0
      })

      // Initialize status detector with current statuses to prevent false notifications
      if (statusDetector.current && data.requests && data.requests.length > 0) {
        statusDetector.current.initializeStatuses(
          data.requests.map((req: RequestWithTotal) => ({ id: req.id, status: req.status }))
        )
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      // Set empty array on error so the UI still renders
      setRequests([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRequests: 0,
        limit: 30,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 1,
        endIndex: 0
      })
    } finally {
      setIsLoading(false)
      setIsPaginationLoading(false)
    }
  }

  // Initialize notification system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      notificationManager.current = new NotificationManager()
      statusDetector.current = new StatusChangeDetector(notificationManager.current)
    }

    return () => {
      // Cleanup polling on unmount
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  // Initialize status filter and search query from URL params
  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || 'all'
    const searchFromUrl = searchParams.get('search') || ''
    setStatusFilter(statusFromUrl)
    setSearchQuery(searchFromUrl)
  }, [searchParams])

  // Fetch requests when status filter, search query, or page changes
  useEffect(() => {
    fetchRequests()
  }, [statusFilter, searchQuery, searchParams])

  // Reset loading states when component unmounts or pathname changes
  useEffect(() => {
    return () => {
      setLoadingNewRequest(false)
    }
  }, [])

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    // Show loading immediately for better UX
    setIsPaginationLoading(true)

    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter)
    } else {
      params.delete('status')
    }
    router.push(`/admin?${params.toString()}`)
  }

  // Handle status filter changes
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    const params = new URLSearchParams()
    params.set('page', '1') // Reset to first page when changing filter
    if (newStatus && newStatus !== 'all') {
      params.set('status', newStatus)
    }
    router.push(`/admin?${params.toString()}`)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Reset to page 1 when searching
    const params = new URLSearchParams()
    params.set('page', '1')
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter)
    }
    if (value && value.trim()) {
      params.set('search', value.trim())
    }
    router.push(`/admin?${params.toString()}`)
  }

  // Start/stop polling based on notifications enabled state
  useEffect(() => {
    if (notificationsEnabled && statusDetector.current) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [notificationsEnabled])

  const startPolling = () => {
    if (pollingInterval.current) return // Already polling
    
    pollingInterval.current = setInterval(() => {
      if (document.hidden) return // Don't poll when tab is not visible
      fetchRequestsForNotifications()
    }, 10000) // Poll every 10 seconds
  }

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
  }

  const fetchRequestsForNotifications = async () => {
    if (!statusDetector.current) return

    try {
      // Get all requests (unpaginated) for notification checking
      const response = await fetch('/api/requests?limit=1000') // Get more requests for comprehensive notification checking
      if (response.ok) {
        const data = await response.json()
        const requests = data.requests || data // Handle both old and new API response formats
        const hasChanges = statusDetector.current.checkForChanges(
          requests.map((req: RequestWithTotal) => ({ id: req.id, status: req.status }))
        )

        // If there are changes, refresh the main requests list with current pagination
        if (hasChanges) {
          fetchRequests() // This will use current page and filters
        }
      }
    } catch (error) {
      console.error('Error polling for updates:', error)
    }
  }

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    if (notificationManager.current) {
      if (notificationsEnabled) {
        // If disabling, clear any existing notifications
        notificationManager.current.clearNotificationIndicator()
      }
    }
  }

  // Clear notifications when user focuses on the dashboard
  const handleFocus = () => {
    if (notificationManager.current) {
      notificationManager.current.clearNotificationIndicator()
    }
  }

  // Add focus event listener
  useEffect(() => {
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleResendWhatsApp = async (request: Request) => {
    const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/o/${request.short_slug}`
    const message = generateWhatsAppMessage(
      request.customer_name,
      request.bike_name,
      request.order_id,
      orderUrl
    )
    // Open WhatsApp (deep link first, web fallback)
    openWhatsApp(request.phone_digits_intl, message)
  }

  const copyOrderLink = (shortSlug: string) => {
    const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/o/${shortSlug}`
    navigator.clipboard.writeText(orderUrl)
    // You could add a toast notification here
    alert('Order link copied to clipboard!')
  }

  const handleNewRequestClick = () => {
    setLoadingNewRequest(true)
    router.push('/admin/new')
  }

  // Utility function to properly escape CSV values
  const escapeCSVValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return ''

    const stringValue = String(value)

    // If the value contains quotes, commas, newlines, or carriage returns, it needs to be quoted
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
      // Escape internal quotes by doubling them and wrap in quotes
      return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
  }

  const generateCSV = (requests: RequestWithTotal[], options: DownloadOptions) => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Phone Number',
      'Bike Model',
      'Status',
      'Created Date',
      'Confirmed Date',
      'Total Amount (INR)' // Changed from ₹ to INR for better compatibility
    ]

    if (options.includeDetails) {
      headers.push('Repair Services', 'Replacement Parts', 'Add-ons', 'Bundles')
    }

    // Start with UTF-8 BOM for Excel compatibility
    const csvRows = ['\uFEFF' + headers.map(escapeCSVValue).join(',')]

    requests.forEach(request => {
      const formatServiceItems = (items: any[], includePricing: boolean) => {
        if (!items || items.length === 0) return ''
        return items.map(item => {
          const itemName = item.label || item.name || 'Unknown Item'
          if (includePricing) {
            const price = item.price_paise ? Math.round(item.price_paise / 100) : 0
            return `${itemName} (INR ${price})` // Changed from ₹ to INR
          }
          return itemName
        }).join('; ') // Changed from comma to semicolon to avoid CSV conflicts
      }

      // Format dates consistently
      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        } catch {
          return ''
        }
      }

      const baseData = [
        escapeCSVValue(request.order_id || ''),
        escapeCSVValue(request.customer_name || ''),
        escapeCSVValue(`+${request.phone_digits_intl || ''}`),
        escapeCSVValue(request.bike_name || ''),
        escapeCSVValue(request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : ''),
        escapeCSVValue(formatDate(request.created_at)),
        escapeCSVValue(request.sent_at ? formatDate(request.sent_at) : ''),
        escapeCSVValue(request.total_paise ? Math.round(request.total_paise / 100).toString() : '0')
      ]

      if (options.includeDetails) {
        const repairItems = request.request_items?.filter(item => item.section === 'repair') || []
        const replacementItems = request.request_items?.filter(item => item.section === 'replacement') || []

        // For future extensibility - addon and bundle data
        const addons: any[] = []
        const bundles: any[] = []

        baseData.push(
          escapeCSVValue(formatServiceItems(repairItems, options.includePricing)),
          escapeCSVValue(formatServiceItems(replacementItems, options.includePricing)),
          escapeCSVValue(formatServiceItems(addons, options.includePricing)),
          escapeCSVValue(formatServiceItems(bundles, options.includePricing))
        )
      }

      csvRows.push(baseData.join(','))
    })

    return csvRows.join('\n')
  }

  const handleDownload = async (options: DownloadOptions) => {
    try {
      setDownloadLoading(true)

      // Build API URL with date range and details
      const params = new URLSearchParams()
      params.set('limit', '1000') // Large limit for export
      params.set('page', '1')
      params.set('start_date', options.startDate)
      params.set('end_date', options.endDate)

      if (options.includeDetails) {
        params.set('include_details', 'true')
      }

      const response = await fetch(`/api/requests?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch requests for download: ${response.status}`)
      }

      const data = await response.json()
      const requests = data.requests || []

      if (requests.length === 0) {
        alert('No requests found for the selected date range.')
        return
      }

      // Generate CSV
      const csvContent = generateCSV(requests, options)

      // Create and download file with proper UTF-8 encoding
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
      })
      const link = document.createElement('a')

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        const filename = `cyclebees_requests_${options.startDate}_to_${options.endDate}.csv`
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        throw new Error('Browser does not support file download')
      }

      setDownloadModal(false)

    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download requests. Please try again.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handlePreviewRequest = async (request: Request) => {
    try {
      setLoadingRequestId(request.id)
      let billData: any

      if (request.status === 'confirmed') {
        // For confirmed requests, get the actual confirmed data
        const [confirmedResponse, requestResponse, addonsResponse, bundlesResponse] = await Promise.all([
          fetch(`/api/requests/${request.id}/confirmed`),
          fetch(`/api/requests/${request.id}`),
          fetch('/api/admin/addons'),
          fetch('/api/bundles')
        ])

        if (!confirmedResponse.ok || !requestResponse.ok) {
          alert('Failed to load request data')
          return
        }

        const { selectedItems, selectedAddons, selectedBundles } = await confirmedResponse.json()
        const requestData = await requestResponse.json()
        const allAddons = addonsResponse.ok ? await addonsResponse.json() : []
        const allBundles = bundlesResponse.ok ? await bundlesResponse.json() : []

        // Build confirmed selections
        const selectedItemsDetails = (requestData.request_items || []).filter(
          (it: any) => selectedItems.includes(it.id)
        )
        const selectedAddonsDetails = (allAddons || []).filter(
          (ad: any) => selectedAddons.includes(ad.id)
        )
        const selectedBundlesDetails = (allBundles || []).filter(
          (bd: any) => (selectedBundles || []).includes(bd.id)
        )

        const subtotal = selectedItemsDetails.reduce((sum: number, it: any) => sum + (it.price_paise || 0), 0)
        const addonsTotal = selectedAddonsDetails.reduce((sum: number, ad: any) => sum + (ad.price_paise || 0), 0)
        const bundlesTotal = selectedBundlesDetails.reduce((sum: number, bd: any) => sum + (bd.price_paise || 0), 0)
        const laCarte = await getLaCartePrice()
        const total = subtotal + addonsTotal + bundlesTotal + laCarte

        billData = {
          order_id: request.order_id,
          customer_name: request.customer_name,
          bike_name: request.bike_name,
          created_at: request.created_at,
          confirmed_at: new Date().toISOString(),
          items: selectedItemsDetails.map((it: any) => ({
            section: it.section,
            label: it.label,
            price_paise: it.price_paise,
          })),
          addons: selectedAddonsDetails.map((ad: any) => ({
            name: ad.name,
            description: ad.description,
            price_paise: ad.price_paise,
          })),
          bundles: selectedBundlesDetails.map((bd: any) => ({
            name: bd.name,
            description: bd.description,
            price_paise: bd.price_paise,
          })),
          subtotal_paise: subtotal,
          addons_paise: addonsTotal,
          bundles_paise: bundlesTotal,
          lacarte_paise: laCarte,
          total_paise: total,
          status: 'confirmed',
        }
      } else {
        // For non-confirmed requests, show all items
        const requestResponse = await fetch(`/api/requests/${request.id}`)
        if (!requestResponse.ok) {
          alert('Failed to load request data')
          return
        }

        const requestData = await requestResponse.json()
        const subtotal = (requestData.request_items || []).reduce((sum: number, item: any) => sum + item.price_paise, 0)
        const laCarte = await getLaCartePrice()

        billData = {
          order_id: request.order_id,
          customer_name: request.customer_name,
          bike_name: request.bike_name,
          created_at: request.created_at,
          items: requestData.request_items || [],
          addons: [], // No addons for non-confirmed requests in preview
          subtotal_paise: subtotal,
          addons_paise: 0,
          lacarte_paise: laCarte,
          total_paise: subtotal + laCarte,
          status: request.status,
        }
      }

      setPreviewModal({
        isOpen: true,
        billData,
        title: `${request.status === 'confirmed' ? 'Confirmed Order Details' : 'Service Request Details'} - ${request.order_id}`
      })
    } catch (error) {
      console.error('Error loading preview data:', error)
      alert('Failed to load preview data. Please try again.')
    } finally {
      setLoadingRequestId(null)
    }
  }


  const handleCancelRequest = async (requestId: string, orderId: string) => {
    const isConfirmed = confirm(
      `Are you sure you want to cancel request ${orderId}? This will preserve the request for records but mark it as cancelled.`
    )
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      if (response.ok) {
        fetchRequests() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(`❌ Failed to cancel request: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('❌ Failed to cancel request. Please check your connection and try again.')
    }
  }

  const handleDeleteRequest = async (requestId: string, orderId: string) => {
    const isConfirmed = confirm(
      `Are you sure you want to permanently delete request ${orderId}? This action cannot be undone.`
    )
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRequests() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(`❌ Failed to delete request: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('❌ Failed to delete request. Please check your connection and try again.')
    }
  }

  const handleDownloadConfirmedPDF = async (request: Request) => {
    if (request.status !== 'confirmed') {
      alert('This order has not been confirmed yet.')
      return
    }

    try {
      // 1) Get confirmed selections (IDs)
      const respConfirmed = await fetch(`/api/requests/${request.id}/confirmed`)
      if (!respConfirmed.ok) {
        alert('Failed to load confirmed selections.')
        return
      }
      const { selectedItems, selectedAddons, selectedBundles } = await respConfirmed.json()

      // 2) Load full request with items
      const respRequest = await fetch(`/api/requests/${request.id}`)
      if (!respRequest.ok) {
        alert('Failed to load request details.')
        return
      }
      const requestData = await respRequest.json()

      // 3) Load addons and bundles
      const respAddons = await fetch('/api/admin/addons')
      const respBundles = await fetch('/api/bundles')
      const allAddons = respAddons.ok ? await respAddons.json() : []
      const allBundles = respBundles.ok ? await respBundles.json() : []

      // 4) Build selected items/addons arrays with full details
      const selectedItemsDetails = (requestData.request_items || []).filter((it: { id: string; price_paise: number; section: string; label: string }) => selectedItems.includes(it.id))
      const selectedAddonsDetails = (allAddons || []).filter((ad: { id: string; name: string; description: string; price_paise: number }) => selectedAddons.includes(ad.id))
      const selectedBundlesDetails = (allBundles || []).filter((bd: { id: string; name: string; description: string; price_paise: number }) => (selectedBundles || []).includes(bd.id))

      // 5) Compute totals
      const subtotal = selectedItemsDetails.reduce((sum: number, it: { price_paise: number }) => sum + (it.price_paise || 0), 0)
      const addonsTotal = selectedAddonsDetails.reduce((sum: number, ad: { price_paise: number }) => sum + (ad.price_paise || 0), 0)
      const bundlesTotal = selectedBundlesDetails.reduce((sum: number, b: { price_paise: number }) => sum + (b.price_paise || 0), 0)
      const laCarte = await getLaCartePrice()
      const total = subtotal + addonsTotal + bundlesTotal + laCarte

      // 6) Create bill data with exact selections
      const billData = {
        order_id: request.order_id,
        customer_name: request.customer_name,
        bike_name: request.bike_name,
        created_at: request.created_at,
        confirmed_at: new Date().toISOString(),
        items: selectedItemsDetails.map((it: { section: string; label: string; price_paise: number }) => ({
          section: it.section,
          label: it.label,
          price_paise: it.price_paise,
        })),
        addons: selectedAddonsDetails.map((ad: { name: string; description: string; price_paise: number }) => ({
          name: ad.name,
          description: ad.description,
          price_paise: ad.price_paise,
        })),
        bundles: selectedBundlesDetails.map((bd: { name: string; description: string; price_paise: number }) => ({
          name: bd.name,
          description: bd.description,
          price_paise: bd.price_paise,
        })),
        subtotal_paise: subtotal,
        addons_paise: addonsTotal,
        bundles_paise: bundlesTotal,
        lacarte_paise: laCarte,
        total_paise: total,
        status: 'confirmed',
        isAdmin: true,
      }

      const { generateBillHTML, createBillDownload } = await import('@/lib/bill-generator')
      const html = generateBillHTML(billData)
      const filename = `Admin_Confirmed_Order_${request.order_id}.pdf`
      createBillDownload(html, filename)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Loading Header - Mimics the actual header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="space-y-1">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Filter buttons skeleton */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Table - Mimics the actual table structure */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-4 text-center">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 mx-auto"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-r-indigo-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
            <div className="space-y-1 mb-6">
              <p className="text-lg font-medium text-gray-800 animate-pulse">Loading Requests...</p>
              <p className="text-xs text-gray-600">📋 Fetching service requests data</p>
            </div>
          </div>

          {/* Table skeleton */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  {/* Table header skeleton */}
                  {['Order ID', 'Customer', 'Bike', 'Items', 'Amount', 'Status', 'Created', 'Actions'].map((header, i) => (
                    <th key={i} className="px-3 py-2 text-left">
                      <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + (i * 10)}px` }}></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {/* Table rows skeleton */}
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="animate-pulse">
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-2 bg-gray-200 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-3 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination skeleton */}
          <div className="border-t border-gray-200/50 p-4">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Optimized Header Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Service Requests
            </h1>
            <p className="text-gray-600 flex items-center gap-1 text-xs">
              <span>📋</span>
              Manage all customer service requests
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={toggleNotifications}
              variant={notificationsEnabled ? "default" : "outline"}
              size="sm"
              className={`transition-all duration-200 h-8 px-3 text-xs ${notificationsEnabled
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
              title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Notifications On</span>
                  <span className="sm:hidden">🔔 On</span>
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Notifications Off</span>
                  <span className="sm:hidden">🔕 Off</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => setDownloadModal(true)}
              variant="outline"
              size="sm"
              className="transition-all duration-200 h-8 px-3 text-xs border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-700"
              title="Download requests as CSV"
            >
              <Download className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Download CSV</span>
              <span className="sm:hidden">📥</span>
            </Button>
            <Button
              onClick={handleNewRequestClick}
              disabled={loadingNewRequest}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto h-8 px-3 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingNewRequest ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 mr-1">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-blue-200 absolute top-0 left-0"></div>
                  </div>
                  <span className="hidden sm:inline">Loading...</span>
                  <span className="sm:hidden">⏳</span>
                </>
              ) : (
                <>
                  <span className="mr-1">+</span>
                  <span className="hidden sm:inline">Create New Request</span>
                  <span className="sm:hidden">New Request</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Optimized Status Filter & Search */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Status Filter Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1 text-gray-700">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-xs">Filter by status:</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {['all', 'pending', 'sent', 'viewed', 'confirmed', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusFilterChange(status)}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-200 text-xs h-7 px-2 ${
                    statusFilter === status
                      ? status === 'pending'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {status === 'pending' ? '⏳ Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Section */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-700">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-xs">Search:</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Order ID, customer, phone, bike..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-64 sm:w-72 h-7 px-3 pr-8 text-xs bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-500 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Requests Table */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-lg font-medium text-gray-700 mb-1">No requests found</p>
            <p className="text-gray-500 mb-4 text-sm">Get started by creating your first service request</p>
            <Button
              onClick={handleNewRequestClick}
              disabled={loadingNewRequest}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg h-8 px-3 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingNewRequest ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 mr-1">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-blue-200 absolute top-0 left-0"></div>
                  </div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span className="mr-1">+</span>
                  Create your first request
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            {/* Pagination Loading Overlay */}
            {isPaginationLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative mb-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 mx-auto"></div>
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-600 border-r-indigo-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Loading page...</p>
                </div>
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    📅 Created
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    🆔 Order ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    👤 Customer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    📱 Phone
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    🚴‍♂️ Bike
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    📊 Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    💰 Total
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ⚡ Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200/50">
                {requests.map((request) => {
                  const isRequestLoading = loadingRequestId === request.id
                  return (
                  <tr
                    key={request.id}
                    className={`hover:bg-blue-50/30 transition-colors duration-200 cursor-pointer relative ${
                      isRequestLoading ? 'opacity-60' : ''
                    }`}
                    onClick={() => !isRequestLoading && handlePreviewRequest(request)}
                    title={isRequestLoading ? "Loading request details..." : "Click to view request details"}
                  >
                    {/* Loading overlay for individual request */}
                    {isRequestLoading && (
                      <td colSpan={8} className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200"></div>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-blue-600 border-r-indigo-500 absolute top-0 left-0"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Loading details...</span>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {formatDate(request.created_at)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {request.order_id}
                        </div>
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded text-xs mt-0.5 inline-block">
                          #{request.short_slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                          {request.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          {request.customer_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full inline-block font-mono">
                        +{request.phone_digits_intl}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900 bg-yellow-50 px-2 py-0.5 rounded-full inline-block">
                        🚴‍♂️ {request.bike_name}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge className={`${getStatusColor(request.status)} px-2 py-0.5 text-xs font-medium rounded-full`}>
                        {request.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-700">
                        {formatCurrency(request.total_paise)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 flex-nowrap">

                        {/* Copy Link */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 h-8 w-8 p-0 flex items-center justify-center min-w-[2rem] min-h-[2rem]"
                          onClick={() => copyOrderLink(request.short_slug)}
                          title="Copy Order Link"
                        >
                          <Copy className="h-5 w-5 flex-shrink-0" />
                        </Button>


                        {/* Download Confirmed PDF */}
                        {request.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all duration-200 h-8 w-8 p-0 flex items-center justify-center min-w-[2rem] min-h-[2rem]"
                            onClick={() => handleDownloadConfirmedPDF(request)}
                            title="Download Confirmed Order PDF"
                          >
                            <Download className="h-5 w-5 flex-shrink-0" />
                          </Button>
                        )}

                        {/* Send/Resend WhatsApp */}
                        {(request.status === 'pending' || request.status === 'sent' || request.status === 'viewed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`transition-all duration-200 h-8 w-8 p-0 flex items-center justify-center min-w-[2rem] min-h-[2rem] ${
                              request.status === 'pending'
                                ? 'border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500 animate-pulse'
                                : 'border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400'
                            }`}
                            onClick={() => handleResendWhatsApp(request)}
                            title={request.status === 'pending' ? 'Send WhatsApp (Failed Initially)' : request.status === 'sent' ? 'Send WhatsApp' : 'Resend WhatsApp'}
                          >
                            <Send className="h-5 w-5 flex-shrink-0" />
                          </Button>
                        )}

                        {/* Smart Cancel/Delete Button - No button for confirmed orders */}
                        {request.status !== 'confirmed' && (
                          <>
                            {request.status === 'cancelled' ? (
                              /* Delete button for already cancelled requests */
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200 h-8 w-8 p-0 flex items-center justify-center min-w-[2rem] min-h-[2rem]"
                                onClick={() => handleDeleteRequest(request.id, request.order_id)}
                                title="Delete cancelled request permanently"
                              >
                                <Trash2 className="h-5 w-5 flex-shrink-0" />
                              </Button>
                            ) : (
                              /* Cancel button for active non-confirmed requests */
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200 h-8 w-8 p-0 flex items-center justify-center min-w-[2rem] min-h-[2rem]"
                                onClick={() => handleCancelRequest(request.id, request.order_id)}
                                title="Cancel request (preserves for records)"
                              >
                                <X className="h-5 w-5 flex-shrink-0" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.totalRequests > 0 && (
          <div className="mt-4 px-4 pb-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalRequests}
              itemsPerPage={pagination.limit}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={handlePageChange}
              disabled={isPaginationLoading}
              className="border-t border-gray-200/50 pt-4"
            />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, billData: null, title: '' })}
        title={previewModal.title}
        size="xl"
      >
        {previewModal.billData && (
          <BillPreview billData={previewModal.billData} />
        )}
      </Modal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadModal}
        onClose={() => setDownloadModal(false)}
        onDownload={handleDownload}
        isLoading={downloadLoading}
      />

    </div>
  )
}
