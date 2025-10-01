'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
  className?: string
  disabled?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  className = '',
  disabled = false
}: PaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const range: (number | string)[] = []

    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        range.push(i)
      }
    } else {
      // Complex pagination logic for many pages
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 5; i++) {
          range.push(i)
        }
        range.push('...')
        range.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        range.push(1)
        range.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          range.push(i)
        }
      } else {
        // In the middle
        range.push(1)
        range.push('...')
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
          range.push(i)
        }
        range.push('...')
        range.push(totalPages)
      }
    }

    return range
  }

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Results info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startIndex}</span> to{' '}
        <span className="font-medium">{endIndex}</span> of{' '}
        <span className="font-medium">{totalItems}</span> requests
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs rounded-xl border-gray-300 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <div key={`ellipsis-${index}`} className="px-2 py-1">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              )
            }

            const isCurrentPage = pageNum === currentPage
            return (
              <Button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                disabled={disabled}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 text-xs rounded-xl transition-all duration-200 ${
                  isCurrentPage
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        {/* Next button */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs rounded-xl border-gray-300 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}