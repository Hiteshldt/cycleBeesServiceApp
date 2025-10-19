'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  title: string
  emoji?: string
  description?: string
  children: React.ReactNode
  defaultExpanded?: boolean
  isCollapsible?: boolean
  count?: number
  className?: string
}

export function CategorySection({
  title,
  emoji,
  description,
  children,
  defaultExpanded = true,
  isCollapsible = true,
  count,
  className = '',
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggleExpanded = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm ${className}`}
    >
      {/* Header - 20% smaller */}
      <div
        className={`
          px-3 py-3 bg-gradient-to-r from-gray-50 to-gray-100
          ${isCollapsible ? 'cursor-pointer hover:from-gray-100 hover:to-gray-200 active:from-gray-200 active:to-gray-300' : ''}
          transition-colors duration-150
        `}
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {emoji && <span className="text-base">{emoji}</span>}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                {count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {count}
                  </span>
                )}
              </div>
              {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
            </div>
          </div>

          {isCollapsible && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content - reduced padding */}
      {isExpanded && <div className="p-3">{children}</div>}
    </div>
  )
}

export default CategorySection
