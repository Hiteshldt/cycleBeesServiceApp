'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Request } from '@/lib/supabase'
import { openWhatsApp, generateWhatsAppMessage } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { BillPreview } from '@/components/BillPreview'
import { getLaCartePrice } from '@/lib/lacarte'
import { DownloadModal, type DownloadOptions } from '@/components/DownloadModal'
import { Pagination } from '@/components/ui/pagination'

// Extracted hooks
import { useNotifications } from './hooks/useNotifications'
import { usePagination } from './hooks/usePagination'
import { useRequests } from './hooks/useRequests'

// Extracted components
import { AdminHeader } from './components/AdminHeader'
import { StatusFilter } from './components/StatusFilter'
import { LoadingState } from './components/LoadingState'
import { RequestsTable } from './components/RequestsTable'

// Extracted utils
import { generateCSV, downloadCSVFile } from './utils/csvExport'

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State management
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null)
  const [loadingNewRequest, setLoadingNewRequest] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
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
    title: '',
  })

  // Custom hooks
  const { pagination, setPagination, handlePageChange } = usePagination(statusFilter)

  const { clearNotifications, initializeStatuses } = useNotifications(notificationsEnabled, () =>
    fetchRequests()
  )

  const { requests, isLoading, isPaginationLoading, fetchRequests } = useRequests(
    statusFilter,
    searchQuery,
    setPagination,
    initializeStatuses
  )

  // Initialize status filter and search query from URL params
  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || 'all'
    const searchFromUrl = searchParams.get('search') || ''
    setStatusFilter(statusFromUrl)
    setSearchQuery(searchFromUrl)
  }, [searchParams])

  // Reset loading states when component unmounts
  useEffect(() => {
    return () => {
      setLoadingNewRequest(false)
    }
  }, [])

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

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    if (notificationsEnabled) {
      // If disabling, clear any existing notifications
      clearNotifications()
    }
  }

  const handleResendWhatsApp = async (request: Request) => {
    const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/o/${request.short_slug}`
    const message = generateWhatsAppMessage(
      request.customer_name,
      request.bike_name,
      request.order_id,
      orderUrl
    )
    openWhatsApp(request.phone_digits_intl, message)
  }

  const copyOrderLink = (shortSlug: string) => {
    const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/o/${shortSlug}`
    navigator.clipboard.writeText(orderUrl)
    alert('Order link copied to clipboard!')
  }

  const handleNewRequestClick = () => {
    setLoadingNewRequest(true)
    router.push('/admin/new')
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

      // Generate and download CSV
      const csvContent = generateCSV(requests, options)
      downloadCSVFile(csvContent, options.startDate, options.endDate)

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
        const [confirmedResponse, requestResponse, addonsResponse, bundlesResponse] =
          await Promise.all([
            fetch(`/api/requests/${request.id}/confirmed`),
            fetch(`/api/requests/${request.id}`),
            fetch('/api/admin/addons'),
            fetch('/api/bundles'),
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
        const selectedItemsDetails = (requestData.request_items || []).filter((it: any) =>
          selectedItems.includes(it.id)
        )
        const selectedAddonsDetails = (allAddons || []).filter((ad: any) =>
          selectedAddons.includes(ad.id)
        )
        const selectedBundlesDetails = (allBundles || []).filter((bd: any) =>
          (selectedBundles || []).includes(bd.id)
        )

        const subtotal = selectedItemsDetails.reduce(
          (sum: number, it: any) => sum + (it.price_paise || 0),
          0
        )
        const addonsTotal = selectedAddonsDetails.reduce(
          (sum: number, ad: any) => sum + (ad.price_paise || 0),
          0
        )
        const bundlesTotal = selectedBundlesDetails.reduce(
          (sum: number, bd: any) => sum + (bd.price_paise || 0),
          0
        )
        const laCarte = request.lacarte_paise ?? (await getLaCartePrice())
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
        const subtotal = (requestData.request_items || []).reduce(
          (sum: number, item: any) => sum + item.price_paise,
          0
        )
        const laCarte = request.lacarte_paise ?? (await getLaCartePrice())

        billData = {
          order_id: request.order_id,
          customer_name: request.customer_name,
          bike_name: request.bike_name,
          created_at: request.created_at,
          items: requestData.request_items || [],
          addons: [],
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
        title: `${request.status === 'confirmed' ? 'Confirmed Order Details' : 'Service Request Details'} - ${request.order_id}`,
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
        fetchRequests()
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
        fetchRequests()
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
      // Get confirmed selections and build PDF
      const respConfirmed = await fetch(`/api/requests/${request.id}/confirmed`)
      if (!respConfirmed.ok) {
        alert('Failed to load confirmed selections.')
        return
      }
      const { selectedItems, selectedAddons, selectedBundles } = await respConfirmed.json()

      const respRequest = await fetch(`/api/requests/${request.id}`)
      if (!respRequest.ok) {
        alert('Failed to load request details.')
        return
      }
      const requestData = await respRequest.json()

      const respAddons = await fetch('/api/admin/addons')
      const respBundles = await fetch('/api/bundles')
      const allAddons = respAddons.ok ? await respAddons.json() : []
      const allBundles = respBundles.ok ? await respBundles.json() : []

      const selectedItemsDetails = (requestData.request_items || []).filter(
        (it: { id: string; price_paise: number; section: string; label: string }) =>
          selectedItems.includes(it.id)
      )
      const selectedAddonsDetails = (allAddons || []).filter(
        (ad: { id: string; name: string; description: string; price_paise: number }) =>
          selectedAddons.includes(ad.id)
      )
      const selectedBundlesDetails = (allBundles || []).filter(
        (bd: { id: string; name: string; description: string; price_paise: number }) =>
          (selectedBundles || []).includes(bd.id)
      )

      const subtotal = selectedItemsDetails.reduce(
        (sum: number, it: { price_paise: number }) => sum + (it.price_paise || 0),
        0
      )
      const addonsTotal = selectedAddonsDetails.reduce(
        (sum: number, ad: { price_paise: number }) => sum + (ad.price_paise || 0),
        0
      )
      const bundlesTotal = selectedBundlesDetails.reduce(
        (sum: number, b: { price_paise: number }) => sum + (b.price_paise || 0),
        0
      )
      const laCarte = request.lacarte_paise ?? (await getLaCartePrice())
      const total = subtotal + addonsTotal + bundlesTotal + laCarte

      const billData = {
        order_id: request.order_id,
        customer_name: request.customer_name,
        bike_name: request.bike_name,
        created_at: request.created_at,
        confirmed_at: new Date().toISOString(),
        items: selectedItemsDetails.map(
          (it: { section: string; label: string; price_paise: number }) => ({
            section: it.section,
            label: it.label,
            price_paise: it.price_paise,
          })
        ),
        addons: selectedAddonsDetails.map(
          (ad: { name: string; description: string; price_paise: number }) => ({
            name: ad.name,
            description: ad.description,
            price_paise: ad.price_paise,
          })
        ),
        bundles: selectedBundlesDetails.map(
          (bd: { name: string; description: string; price_paise: number }) => ({
            name: bd.name,
            description: bd.description,
            price_paise: bd.price_paise,
          })
        ),
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
    return <LoadingState />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <AdminHeader
        notificationsEnabled={notificationsEnabled}
        loadingNewRequest={loadingNewRequest}
        onToggleNotifications={toggleNotifications}
        onDownload={() => setDownloadModal(true)}
        onNewRequest={handleNewRequestClick}
      />

      {/* Status Filter & Search */}
      <StatusFilter
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusChange={handleStatusFilterChange}
        onSearchChange={handleSearchChange}
      />

      {/* Requests Table */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-lg font-medium text-gray-700 mb-1">No requests found</p>
            <p className="text-gray-500 mb-4 text-sm">
              Get started by creating your first service request
            </p>
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
          <RequestsTable
            requests={requests}
            isPaginationLoading={isPaginationLoading}
            loadingRequestId={loadingRequestId}
            onPreviewRequest={handlePreviewRequest}
            onCopyLink={copyOrderLink}
            onDownloadPDF={handleDownloadConfirmedPDF}
            onResendWhatsApp={handleResendWhatsApp}
            onCancelRequest={handleCancelRequest}
            onDeleteRequest={handleDeleteRequest}
          />
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
        {previewModal.billData && <BillPreview billData={previewModal.billData} />}
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
