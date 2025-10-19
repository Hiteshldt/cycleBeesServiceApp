import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Request } from '@/lib/supabase'
import { PaginationInfo } from './usePagination'

type RequestWithTotal = Request & {
  total_items: number
  request_items?: any[]
}

export function useRequests(
  statusFilter: string,
  searchQuery: string,
  setPagination: (pagination: PaginationInfo) => void,
  initializeStatuses: (statuses: { id: string; status: string }[]) => void
) {
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState<RequestWithTotal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaginationLoading, setIsPaginationLoading] = useState(false)

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
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRequests: 0,
          limit: 30,
          hasNextPage: false,
          hasPrevPage: false,
          startIndex: 1,
          endIndex: 0,
        }
      )

      // Initialize status detector with current statuses
      if (data.requests && data.requests.length > 0) {
        initializeStatuses(
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
        endIndex: 0,
      })
    } finally {
      setIsLoading(false)
      setIsPaginationLoading(false)
    }
  }

  // Fetch requests when status filter, search query, or page changes
  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, searchParams])

  return {
    requests,
    isLoading,
    isPaginationLoading,
    setIsPaginationLoading,
    fetchRequests,
  }
}
