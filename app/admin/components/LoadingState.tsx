import React from 'react'

export function LoadingState() {
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
                {[
                  'Order ID',
                  'Customer',
                  'Bike',
                  'Items',
                  'Amount',
                  'Status',
                  'Created',
                  'Actions',
                ].map((header, i) => (
                  <th key={i} className="px-3 py-2 text-left">
                    <div
                      className="h-3 bg-gray-200 rounded animate-pulse"
                      style={{ width: `${60 + i * 10}px` }}
                    ></div>
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
