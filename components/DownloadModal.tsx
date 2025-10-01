'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Download, Calendar, FileText } from 'lucide-react'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (options: DownloadOptions) => void
  isLoading?: boolean
}

export interface DownloadOptions {
  startDate: string
  endDate: string
  includeDetails: boolean
  includePricing: boolean
}

export function DownloadModal({ isOpen, onClose, onDownload, isLoading = false }: DownloadModalProps) {
  const [startDate, setStartDate] = useState(() => {
    // Default to 30 days ago
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })

  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0]
  })

  const [includeDetails, setIncludeDetails] = useState(true)
  const [includePricing, setIncludePricing] = useState(true)

  const setQuickRange = (days: number | 'all') => {
    const today = new Date().toISOString().split('T')[0]
    setEndDate(today)

    if (days === 'all') {
      // Set start date to a very early date for "all time"
      setStartDate('2020-01-01')
    } else {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      setStartDate(startDate.toISOString().split('T')[0])
    }
  }

  const handleDownload = () => {
    onDownload({
      startDate,
      endDate,
      includeDetails,
      includePricing
    })
  }

  const isValidDateRange = startDate && endDate && startDate <= endDate

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Download Requests" size="md">
      <div className="p-6">
        {/* Header Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur opacity-20"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-xl">
              <Download className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Export service requests to CSV format</p>
          </div>
        </div>

        {/* Date Range Section */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-gray-700">Date Range</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-xs text-gray-600">From Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-sm rounded-xl border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-xs text-gray-600">To Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm rounded-xl border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Quick Range Buttons */}
            <div className="flex gap-1 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRange(7)}
                className="h-7 px-2 text-xs rounded-lg border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              >
                Last 7 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRange(30)}
                className="h-7 px-2 text-xs rounded-lg border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              >
                Last 30 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRange(90)}
                className="h-7 px-2 text-xs rounded-lg border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              >
                Last 3 months
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRange('all')}
                className="h-7 px-2 text-xs rounded-lg border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              >
                All time
              </Button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-gray-700">Export Options</Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeDetails"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="includeDetails" className="text-sm text-gray-700 cursor-pointer">
                  Include Service Details
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Export repair services, replacement parts, and add-ons in detail columns
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includePricing"
                  checked={includePricing}
                  onChange={(e) => setIncludePricing(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="includePricing" className="text-sm text-gray-700 cursor-pointer">
                  Include Item Pricing
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Show individual prices for each service and part
              </p>
            </div>
          </div>

          {/* Download Button */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 h-9 text-sm rounded-xl border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownload}
                disabled={!isValidDateRange || isLoading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-9 text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-green-200 absolute top-0 left-0"></div>
                    </div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Generate CSV
                  </div>
                )}
              </Button>
            </div>

            {!isValidDateRange && (
              <p className="text-xs text-red-500 mt-2">
                Please select a valid date range (start date must be before or equal to end date)
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}