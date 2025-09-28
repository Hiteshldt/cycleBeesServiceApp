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
import { Eye, Send, Copy, Filter, Download, Bell, BellOff, Trash2, FileText } from 'lucide-react'

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

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchRequests() // Refresh the list
    } catch (error) {
      console.error('Error updating request status:', error)
    }
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
        title: `${request.status === 'confirmed' ? 'Confirmed Order' : 'Service Estimate'} - ${request.order_id}`
      })
    } catch (error) {
      console.error('Error loading preview data:', error)
      alert('Failed to load preview data. Please try again.')
    }
  }


  const handleDeleteRequest = async (requestId: string, orderId: string) => {
    const isConfirmed = confirm(`Are you sure you want to delete request ${orderId}? This action cannot be undone.`)
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
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <div className="spinner"></div>
          <div className="text-lg text-gray-600">Loading requests...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-gray-600">Manage all customer service requests</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={toggleNotifications}
            variant={notificationsEnabled ? "default" : "outline"}
            size="sm"
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Notifications Off
              </>
            )}
          </Button>
          <Link href="/admin/new">
            <Button>Create New Request</Button>
          </Link>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        <div className="flex gap-2">
          {['all', 'sent', 'viewed', 'confirmed', 'cancelled'].map((status) => (
            <Button
              key={status}
              onClick={() => setStatusFilter(status)}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No requests found.</p>
            <Link href="/admin/new">
              <Button className="mt-4">Create your first request</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bike
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.order_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        #{request.short_slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      +{request.phone_digits_intl}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.bike_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.toUpperCase()}
                        </Badge>
                        {request.status !== 'sent' && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">
                            Locked
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(request.total_paise)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* View Order Page */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/o/${request.short_slug}`, '_blank')}
                          title="View Order Page"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Copy Link */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyOrderLink(request.short_slug)}
                          title="Copy Order Link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>


                        {/* Preview/View Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewRequest(request)}
                          title="Quick Preview"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>

                        {/* Download Confirmed PDF */}
                        {request.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadConfirmedPDF(request)}
                            title="Download Confirmed Order PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Send/Resend WhatsApp */}
                        {(request.status === 'sent' || request.status === 'viewed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendWhatsApp(request)}
                            title={request.status === 'sent' ? 'Send WhatsApp' : 'Resend WhatsApp'}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete Request - Available for all requests */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRequest(request.id, request.order_id)}
                          title="Delete Request"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {/* Status Actions */}
                        {(request.status === 'sent' || request.status === 'viewed') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(request.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
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
