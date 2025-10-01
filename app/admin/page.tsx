'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Request } from '@/lib/supabase'
import { formatCurrency, formatDate, getStatusColor, openWhatsApp, generateWhatsAppMessage } from '@/lib/utils'
import { NotificationManager, StatusChangeDetector } from '@/lib/notification'
import { Modal } from '@/components/ui/modal'
import { BillPreview } from '@/components/BillPreview'
import { getLaCartePrice } from '@/lib/lacarte'
import { Eye, Send, Copy, Filter, Download, Bell, BellOff, Trash2, FileText, X } from 'lucide-react'

type RequestWithTotal = Request & {
  total_items: number
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestWithTotal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
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
  
  // Notification system refs
  const notificationManager = useRef<NotificationManager | null>(null)
  const statusDetector = useRef<StatusChangeDetector | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  const fetchRequests = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/requests'
        : `/api/requests?status=${statusFilter}`
      
      console.log('Fetching requests from:', url)
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Received data:', data)
      setRequests(data)
      
      // Initialize status detector with current statuses to prevent false notifications
      if (statusDetector.current && data.length > 0) {
        statusDetector.current.initializeStatuses(
          data.map((req: RequestWithTotal) => ({ id: req.id, status: req.status }))
        )
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      // Set empty array on error so the UI still renders
      setRequests([])
    } finally {
      setIsLoading(false)
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

  // Fetch requests and check for changes
  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

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
      const response = await fetch('/api/requests')
      if (response.ok) {
        const data = await response.json()
        const hasChanges = statusDetector.current.checkForChanges(
          data.map((req: RequestWithTotal) => ({ id: req.id, status: req.status }))
        )
        
        // If there are changes, refresh the main requests list
        if (hasChanges) {
          setRequests(data)
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


  const handlePreviewRequest = async (request: Request) => {
    try {
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
        alert(`✅ Request ${orderId} cancelled successfully`)
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
        alert(`✅ Request ${orderId} deleted successfully`)
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
      <div className="min-h-64 flex justify-center items-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-r-indigo-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-800 animate-pulse">Loading Requests...</p>
            <p className="text-xs text-gray-600">📋 Fetching service requests data</p>
          </div>
          {/* Compact Loading skeleton cards */}
          <div className="mt-6 space-y-2 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/60 rounded-xl p-3 shadow-sm animate-pulse border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
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
            <Link href="/admin/new">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto h-8 px-3 text-xs">
                <span className="mr-1">+</span>
                <span className="hidden sm:inline">Create New Request</span>
                <span className="sm:hidden">New Request</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Optimized Status Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1 text-gray-700">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-xs">Filter by status:</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {['all', 'sent', 'viewed', 'confirmed', 'cancelled'].map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status)}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className={`transition-all duration-200 text-xs h-7 px-2 ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
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
            <Link href="/admin/new">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg h-8 px-3 text-xs">
                <span className="mr-1">+</span>
                Create your first request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-blue-50/30 transition-colors duration-200 cursor-pointer"
                    onClick={() => handlePreviewRequest(request)}
                    title="Click to view request details"
                  >
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
                        {(request.status === 'sent' || request.status === 'viewed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all duration-200 h-8 w-8 p-0 flex items-center justify-center min-w-[2rem] min-h-[2rem]"
                            onClick={() => handleResendWhatsApp(request)}
                            title={request.status === 'sent' ? 'Send WhatsApp' : 'Resend WhatsApp'}
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
                ))}
              </tbody>
            </table>
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

    </div>
  )
}
