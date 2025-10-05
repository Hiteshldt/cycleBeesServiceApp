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
        group relative rounded-xl border transition-all duration-300 cursor-pointer bg-white
        ${bulletPoints && bulletPoints.length > 0
          ? 'bundle-card'
          : 'hover:shadow-lg hover:shadow-yellow-100/50 hover:-translate-y-0.5'
        }
        active:scale-[0.98]
        ${isSelected
          ? bulletPoints && bulletPoints.length > 0
            ? 'border-purple-400 animate-premium-pulse'
            : 'border-yellow-400 bg-gradient-to-r from-yellow-50/60 to-orange-50/40 shadow-md shadow-yellow-100/30 ring-2 ring-yellow-200/50'
          : bulletPoints && bulletPoints.length > 0
            ? 'border-purple-200 hover:border-purple-300'
            : 'border-gray-200 hover:border-yellow-300/60 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-yellow-50/20'
        }
        ${isRecommended && !isSelected ? 'border-blue-300 bg-gradient-to-r from-blue-50/40 to-indigo-50/20' : ''}
        ${className}
      `}
      onClick={() => !isRequired && onToggle(id)}
    >
      {/* Content - Compact or Detailed based on content */}
      {bulletPoints && bulletPoints.length > 0 ? (
        // Premium Bundle Card Design
        <div className="relative overflow-hidden">
          {/* Premium Header with Gradient Background */}
          <div className={`
            relative px-4 py-4 bg-gradient-to-br
            ${isSelected
              ? 'from-purple-600 via-purple-500 to-indigo-600'
              : 'from-purple-500 via-indigo-500 to-blue-600'
            }
          `}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-3 -translate-x-3"></div>

            {/* Top Row: Badges and Selection */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              {/* Left: Badges */}
              <div className="flex gap-1.5">
                {/* Popular Badge */}
                <div className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-bold border border-white/30">
                  🎁 Bundle
                </div>
                {/* Discount Badge */}
                {discount && (
                  <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg">
                    -{discount.percentage}% OFF
                  </div>
                )}
              </div>

              {/* Selection Checkbox */}
              <div className="flex-shrink-0">
                {isRequired ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-300/50 ring-3 ring-white/30">
                    <Check className="w-4 h-4 text-white animate-pulse" />
                  </div>
                ) : (
                  <div className={`
                    w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-12
                    ${isSelected
                      ? 'border-white bg-white shadow-xl shadow-white/50 ring-3 ring-white/30'
                      : 'border-white/50 group-hover:border-white group-hover:bg-white/20 group-hover:shadow-lg group-hover:shadow-white/30'
                    }
                  `}>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 animate-bounce font-bold" />}
                  </div>
                )}
              </div>
            </div>

            {/* Service Name and Price */}
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:scale-105 transition-transform">
                {title}
              </h3>

              {/* Price Display - Prominent */}
              <div className="flex items-baseline gap-2 mb-2">
                {discount ? (
                  <>
                    <span className="text-white/60 text-xs line-through">
                      {formatCurrency(discount.originalPrice)}
                    </span>
                    <span className="text-white font-black text-2xl tracking-tight">
                      {formatCurrency(price)}
                    </span>
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                      SAVE {formatCurrency(discount.originalPrice - price)}
                    </span>
                  </>
                ) : (
                  <span className="text-white font-black text-2xl tracking-tight group-hover:scale-105 transition-transform">
                    {formatCurrency(price)}
                  </span>
                )}
              </div>

              {/* Description */}
              {description && (
                <p className="text-white/80 text-xs leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Features Section with Glass Effect */}
          <div className="px-4 py-4 bg-white/95 backdrop-blur-sm">
            <div className="mb-3">
              <h4 className="text-gray-900 font-semibold text-xs mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                What&apos;s Included
              </h4>

              <div className="grid gap-2">
                {bulletPoints.slice(0, 3).map((point, index) => (
                  <div key={index} className="flex items-start gap-2.5 group/item">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                      <Check className="w-2.5 h-2.5 text-white font-bold" />
                    </div>
                    <span className="text-gray-700 text-xs leading-relaxed group-hover/item:text-gray-900 transition-colors">
                      {point}
                    </span>
                  </div>
                ))}

                {bulletPoints.length > 3 && (
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">+</span>
                    </div>
                    <span className="text-purple-600 font-semibold text-xs">
                      {bulletPoints.length - 3} more premium services included
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Value Proposition */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-green-600 font-semibold text-xs">Best Value Package</span>
                </div>
                <span className="text-purple-600 font-bold text-xs">Complete Care</span>
              </div>
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
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200/50">
                    <Check className="w-4 h-4 text-white animate-pulse" />
                  </div>
                ) : (
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-105
                    ${isSelected
                      ? 'border-yellow-500 bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg shadow-yellow-200/60 animate-pulse'
                      : 'border-gray-300 group-hover:border-yellow-400/70 group-hover:shadow-md group-hover:shadow-yellow-100/50'
                    }
                  `}>
                    {isSelected && (
                      <Check className="w-4 h-4 text-white animate-bounce" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Service Name */}
                <h3 className="font-medium text-gray-900 text-base leading-tight">
                  {title}
                </h3>

                {/* Description */}
                {description && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {description}
                  </p>
                )}

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
                <div className="space-y-1">
                  <div className="text-xs text-gray-400 line-through opacity-75 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(discount.originalPrice)}
                  </div>
                  <div className="text-base font-bold text-green-600 group-hover:text-green-700 transition-colors">
                    {formatCurrency(price)}
                  </div>
                </div>
              ) : (
                <div className={`
                  text-base font-bold transition-all duration-300 group-hover:scale-105
                  ${isSelected
                    ? 'text-yellow-600 group-hover:text-yellow-700'
                    : 'text-gray-900 group-hover:text-gray-800'
                  }
                `}>
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