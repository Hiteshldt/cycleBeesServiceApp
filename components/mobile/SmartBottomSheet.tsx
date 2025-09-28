"use client"

import React from "react"
import { ArrowRight, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

type Props = {
  totalAmount: number
  selectedCount: number
  primaryLabel: string
  onPrimary: () => void
  isPrimaryDisabled?: boolean
  isPrimaryLoading?: boolean
  secondaryLabel?: string
  onSecondary?: () => void
  summaryText?: string
  className?: string
  children?: React.ReactNode
}

export function SmartBottomSheet({
  totalAmount,
  selectedCount,
  primaryLabel,
  onPrimary,
  isPrimaryDisabled = false,
  isPrimaryLoading = false,
  secondaryLabel,
  onSecondary,
  summaryText,
  className = "",
  children
}: Props) {
  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50
      bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90
      border-t border-gray-200
      safe-bottom
      ${className}
    `}>
      {/* Drag Handle */}
      <div className="flex justify-center py-2">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-4">
        {/* Quick Summary */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </span>
              {selectedCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {selectedCount} selected
                </span>
              )}
            </div>
            {summaryText && (
              <span className="text-sm text-gray-600">{summaryText}</span>
            )}
          </div>

          {/* Expand Indicator */}
          <ChevronUp className="w-5 h-5 text-gray-400" />
        </div>

        {/* Custom Content */}
        {children}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {secondaryLabel && onSecondary && (
            <Button
              variant="outline"
              onClick={onSecondary}
              className="flex-1 h-12 text-sm font-medium"
            >
              {secondaryLabel}
            </Button>
          )}

          <Button
            onClick={onPrimary}
            disabled={isPrimaryDisabled || isPrimaryLoading}
            className={`
              h-12 text-sm font-semibold transition-all duration-200
              bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
              disabled:from-gray-400 disabled:to-gray-500
              ${secondaryLabel ? 'flex-[2]' : 'flex-1'}
            `}
          >
            {isPrimaryLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
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

export default SmartBottomSheet