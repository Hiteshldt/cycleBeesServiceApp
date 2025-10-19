import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Request } from '@/lib/supabase'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Copy, Send, Download, X, Trash2 } from 'lucide-react'

type RequestWithTotal = Request & {
  total_items: number
  request_items?: any[]
}

interface RequestsTableProps {
  requests: RequestWithTotal[]
  isPaginationLoading: boolean
  loadingRequestId: string | null
  onPreviewRequest: (request: Request) => void
  onCopyLink: (shortSlug: string) => void
  onDownloadPDF: (request: Request) => void
  onResendWhatsApp: (request: Request) => void
  onCancelRequest: (requestId: string, orderId: string) => void
  onDeleteRequest: (requestId: string, orderId: string) => void
}

export function RequestsTable({
  requests,
  isPaginationLoading,
  loadingRequestId,
  onPreviewRequest,
  onCopyLink,
  onDownloadPDF,
  onResendWhatsApp,
  onCancelRequest,
  onDeleteRequest,
}: RequestsTableProps) {
  return (
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
                onClick={() => !isRequestLoading && onPreviewRequest(request)}
                title={
                  isRequestLoading ? 'Loading request details...' : 'Click to view request details'
                }
              >
                {/* Loading overlay for individual request */}
                {isRequestLoading && (
                  <td
                    colSpan={8}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center"
                  >
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
                  <div className="text-xs text-gray-900">{formatDate(request.created_at)}</div>
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
                    <div className="text-xs font-medium text-gray-900">{request.customer_name}</div>
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
                  <Badge
                    className={`${getStatusColor(request.status)} px-2 py-0.5 text-xs font-medium rounded-full`}
                  >
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
                      onClick={() => onCopyLink(request.short_slug)}
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
                        onClick={() => onDownloadPDF(request)}
                        title="Download Confirmed Order PDF"
                      >
                        <Download className="h-5 w-5 flex-shrink-0" />
                      </Button>
                    )}

                    {/* Send/Resend WhatsApp */}
                    {(request.status === 'pending' ||
                      request.status === 'sent' ||
                      request.status === 'viewed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`transition-all duration-200 h-8 w-8 p-0 flex items-center justify-center min-w-[2rem] min-h-[2rem] ${
                          request.status === 'pending'
                            ? 'border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500 animate-pulse'
                            : 'border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400'
                        }`}
                        onClick={() => onResendWhatsApp(request)}
                        title={
                          request.status === 'pending'
                            ? 'Send WhatsApp (Failed Initially)'
                            : request.status === 'sent'
                              ? 'Send WhatsApp'
                              : 'Resend WhatsApp'
                        }
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
                            onClick={() => onDeleteRequest(request.id, request.order_id)}
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
                            onClick={() => onCancelRequest(request.id, request.order_id)}
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
  )
}
