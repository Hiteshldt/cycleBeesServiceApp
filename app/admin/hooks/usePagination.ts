import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalRequests: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startIndex: number
  endIndex: number
}

export function usePagination(statusFilter: string) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    limit: 30,
    hasNextPage: false,
    hasPrevPage: false,
    startIndex: 1,
    endIndex: 0,
  })

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter)
    } else {
      params.delete('status')
    }
    router.push(`/admin?${params.toString()}`)
  }

  return {
    pagination,
    setPagination,
    handlePageChange,
  }
}
