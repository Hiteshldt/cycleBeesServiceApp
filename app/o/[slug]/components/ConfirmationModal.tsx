'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { LaCarteSettings } from '@/lib/lacarte'

type ConfirmationModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  isConfirming: boolean
  laCarte: LaCarteSettings | null
  laCartePaise: number
  totals: {
    subtotal: number
    addonsTotal: number
    bundlesTotal: number
    total: number
  }
  selectedCounts: {
    services: number
    addons: number
    bundles: number
  }
}

export function ConfirmationModal({
  open,
  onCancel,
  onConfirm,
  isConfirming,
  laCarte,
  laCartePaise,
  totals,
  selectedCounts,
}: ConfirmationModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-6 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-3 -translate-x-3"></div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="text-2xl">??</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Confirm Your Order</h3>
              <p className="text-white/80 text-sm">Review and finalize your service package</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Order Summary
                </h4>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <span className="text-sm text-gray-700">
                      Selected Services ({selectedCounts.services} items)
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>

                {selectedCounts.addons > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">
                        Add-on Services ({selectedCounts.addons} items)
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(totals.addonsTotal)}
                    </span>
                  </div>
                )}

                {selectedCounts.bundles > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">
                        Service Bundles ({selectedCounts.bundles} items)
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(totals.bundlesTotal)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start py-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">La Carte Services</span>
                    </div>
                    {laCarte && laCarte.real_price_paise > laCarte.current_price_paise && (
                      <div className="ml-3.5 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs line-through text-gray-400">
                            {formatCurrency(laCarte.real_price_paise)}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                            -
                            {Math.round(
                              ((laCarte.real_price_paise - laCarte.current_price_paise) /
                                Math.max(laCarte.real_price_paise, 1)) *
                                100
                            )}
                            % OFF
                          </span>
                        </div>
                        {laCarte.discount_note && (
                          <div className="text-xs text-green-600 mt-0.5">
                            {laCarte.discount_note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(laCartePaise)}
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-600 text-sm">??</span>
              </div>
              <div>
                <h5 className="font-semibold text-amber-800 mb-1">Important Notice</h5>
                <p className="text-sm text-amber-700 leading-relaxed">
                  This is the estimated amount for your service. Final charges may vary slightly due
                  to additional services or parts required during the service.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 flex gap-3 flex-shrink-0 border-t border-gray-100 bg-white">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-12 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200/50 transition-all duration-300 transform hover:scale-105"
            disabled={isConfirming}
          >
            {isConfirming ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Confirming...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Confirm Order
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
