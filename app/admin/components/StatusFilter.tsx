import React from 'react'
import { Button } from '@/components/ui/button'
import { Filter, Search, X } from 'lucide-react'

interface StatusFilterProps {
  statusFilter: string
  searchQuery: string
  onStatusChange: (status: string) => void
  onSearchChange: (query: string) => void
}

export function StatusFilter({
  statusFilter,
  searchQuery,
  onStatusChange,
  onSearchChange,
}: StatusFilterProps) {
  return (
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
                onClick={() => onStatusChange(status)}
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
                {status === 'pending'
                  ? '⏳ Pending'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64 sm:w-72 h-7 px-3 pr-8 text-xs bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
