"use client"

import React from "react"
import { Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type CardType = "repair" | "replacement" | "addon" | "bundle" | "lacarte"

type Props = {
  id: string
  title: string
  description?: string
  price: number
  isSelected: boolean
  isRecommended?: boolean
  isRequired?: boolean
  type: CardType
  bulletPoints?: string[]
  discount?: {
    originalPrice: number
    percentage: number
  }
  onToggle: (id: string) => void
  className?: string
}

// Removed typeConfig as it's no longer used in the minimal design

export function SelectionCard({
  id,
  title,
  description,
  price,
  isSelected,
  isRecommended = false,
  isRequired = false,
  type: _type,
  bulletPoints,
  discount,
  onToggle,
  className = ""
}: Props) {
  return (
    <div
      className={`
        rounded-lg border transition-all duration-200 cursor-pointer bg-white hover:shadow-md
        ${isSelected
          ? 'border-yellow-400 bg-yellow-50/30'
          : 'border-gray-200 hover:border-gray-300'
        }
        ${className}
      `}
      onClick={() => !isRequired && onToggle(id)}
    >
      {/* Content - Compact or Detailed based on content */}
      {bulletPoints && bulletPoints.length > 0 ? (
        // Detailed card for La Carte service
        <div className="p-4">
          {/* Header with same alignment as compact cards */}
          <div className="flex items-center gap-3 mb-3">
            {/* Left: Badges */}
            <div className="flex gap-2 flex-shrink-0">
              {/* Discount Badge */}
              {discount && (
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                  -{discount.percentage}% OFF
                </div>
              )}
              {/* Recommendation Badge */}
              {isRecommended && !discount && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-medium">
                  ⭐ Recommended
                </div>
              )}
            </div>

            {/* Selection Checkbox */}
            <div className="flex-shrink-0">
              {isRequired ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isSelected
                    ? 'border-yellow-500 bg-yellow-500'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
            </div>

            {/* Service Name */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-base leading-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Bullet Points */}
          <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
            <div className="space-y-2">
              {bulletPoints.slice(0, 3).map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
                </div>
              ))}
              {bulletPoints.length > 3 && (
                <div className="text-sm text-green-600 font-medium ml-4">
                  +{bulletPoints.length - 3} more included
                </div>
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-end pt-2 border-t border-gray-100">
            <div className="text-right">
              {discount ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(discount.originalPrice)}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Save {formatCurrency(discount.originalPrice - price)}
                    </span>
                  </div>
                  <div className="text-base font-bold text-green-600">
                    {formatCurrency(price)}
                  </div>
                </div>
              ) : (
                <div className="text-base font-bold text-gray-900">
                  {formatCurrency(price)}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Simple layout: Tick, Name, Recommended below, Price on right
        <div className="p-3">
          <div className="flex items-start justify-between">
            {/* Left side: Checkbox + Content */}
            <div className="flex items-start gap-3 flex-1">
              {/* Selection Checkbox */}
              <div className="flex-shrink-0">
                {isRequired ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isSelected
                      ? 'border-yellow-500 bg-yellow-500'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Service Name */}
                <h3 className="font-medium text-gray-900 text-base leading-tight">
                  {title}
                </h3>

                {/* Recommended text below */}
                {isRecommended && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Recommended
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Price */}
            <div className="text-right flex-shrink-0 ml-3">
              {discount ? (
                <div>
                  <div className="text-xs text-gray-400 line-through">
                    {formatCurrency(discount.originalPrice)}
                  </div>
                  <div className="text-base font-bold text-green-600">
                    {formatCurrency(price)}
                  </div>
                </div>
              ) : (
                <div className="text-base font-bold text-gray-900">
                  {formatCurrency(price)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectionCard