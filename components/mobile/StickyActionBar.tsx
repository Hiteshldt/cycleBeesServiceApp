"use client"

import React, { useState } from "react"
import { ArrowRight, ChevronUp, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ServiceBreakdown = {
  selectedServicesPaise: number
  selectedCount: number
  laCartePaise: number
  laCarteDisplay?: {
    currentPrice: number
    originalPrice?: number
    discountPercentage?: number
    discountNote?: string
    hasDiscount: boolean
  }
}

type Props = {
  totalPaise: number
  primaryLabel: string
  onPrimary: () => void
  disabled?: boolean
  loading?: boolean
  selectedCount?: number
  summaryText?: string
  rightSlot?: React.ReactNode
  // New props for breakdown
  isExpandable?: boolean
  servicesBreakdown?: ServiceBreakdown
}

export function StickyActionBar({
  totalPaise,
  primaryLabel,
  onPrimary,
  disabled = false,
  loading = false,
  selectedCount,
  summaryText,
  rightSlot,
  isExpandable = false,
  servicesBreakdown
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      {/* Drag Handle */}
      <div className="flex justify-center py-2">
        <div className="w-8 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="mx-auto max-w-md px-4 pb-4">
        {/* Summary Info - Clickable if expandable */}
        <div
          className={`mb-3 ${isExpandable ? 'cursor-pointer' : ''}`}
          onClick={toggleExpanded}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Services Total
              </span>
              {isExpandable && (
                <div className="text-gray-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(totalPaise)}
              </span>
              {selectedCount !== undefined && selectedCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  {selectedCount} selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Breakdown */}
        {isExpandable && isExpanded && servicesBreakdown && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Services Summary</h3>

            <div className="space-y-3 text-sm">
              {/* Selected Services */}
              <div className="flex justify-between text-gray-700">
                <span>Selected Services ({servicesBreakdown.selectedCount} items)</span>
                <span className="font-medium">{formatCurrency(servicesBreakdown.selectedServicesPaise)}</span>
              </div>

              {/* La Carte Services */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-gray-700 font-medium">La Carte Services (Fixed)</span>
                    {servicesBreakdown.laCarteDisplay?.hasDiscount && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs line-through text-gray-400">
                          {formatCurrency(servicesBreakdown.laCarteDisplay.originalPrice!)}
                        </span>
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                          -{servicesBreakdown.laCarteDisplay.discountPercentage}%
                        </span>
                      </div>
                    )}
                    {servicesBreakdown.laCarteDisplay?.discountNote && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {servicesBreakdown.laCarteDisplay.discountNote}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-green-700">
                    {formatCurrency(servicesBreakdown.laCartePaise)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Services Total</span>
                  <span>{formatCurrency(totalPaise)}</span>
                </div>
              </div>
            </div>

            {/* Summary Text in Expanded View */}
            {summaryText && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">{summaryText}</p>
              </div>
            )}
          </div>
        )}

        {/* Summary text when collapsed */}
        {(!isExpandable || !isExpanded) && summaryText && (
          <div className="mb-3">
            <p className="text-xs text-gray-500">{summaryText}</p>
          </div>
        )}

        {/* Action Area */}
        <div className="flex items-center gap-2">
          {rightSlot && (
            <div className="flex-shrink-0">
              {rightSlot}
            </div>
          )}

          <Button
            onClick={onPrimary}
            disabled={disabled || loading}
            className={`
              flex-1 h-11 text-sm font-medium transition-all duration-200
              bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500
              text-gray-900 hover:text-gray-900
              disabled:from-gray-300 disabled:to-gray-400
              ${loading ? 'cursor-wait' : ''}
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {primaryLabel}
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StickyActionBar

