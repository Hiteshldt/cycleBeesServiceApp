"use client"

import React from "react"
import Image from "next/image"
import { ArrowLeft, HeadphonesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  title?: string
  subtitle?: string
  rightSlot?: React.ReactNode
  showBack?: boolean
  onBack?: () => void
  onHelp?: () => void
  progress?: number // 0-100 for progress bar
  step?: string // e.g., "Step 1 of 3"
}

export function AppHeader({
  title,
  subtitle,
  rightSlot,
  showBack = false,
  onBack,
  onHelp,
  progress,
  step
}: Props) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="mx-auto max-w-md">
        {/* Compact Single Line Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400">
          {/* Left: Back Button + Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-7 w-7 rounded-full p-0 hover:bg-white/20 text-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Image
                src="/logo.png"
                alt="CycleBees Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            )}
            <div className="text-sm font-bold text-gray-800">CycleBees</div>
          </div>

          {/* Center: Page Info (Title/Subtitle) */}
          <div className="flex-1 mx-3 min-w-0 text-center">
            {title && (
              <div className="text-xs font-semibold text-gray-800 truncate">{title}</div>
            )}
            {subtitle && (
              <div className="text-[10px] text-gray-700 truncate">{subtitle}</div>
            )}
          </div>

          {/* Right: Step/Progress + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Step indicator */}
            {step && typeof progress === 'number' && (
              <div className="text-[10px] font-medium text-gray-800 whitespace-nowrap">
                {step}
              </div>
            )}

            {/* Help Button */}
            {onHelp && (
              <button
                onClick={onHelp}
                className="h-7 w-7 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <HeadphonesIcon className="h-3.5 w-3.5 text-gray-800" />
              </button>
            )}

            {/* Right slot (e.g., order badge) */}
            {rightSlot}
          </div>
        </div>

        {/* Thin Progress Bar (if progress is provided) */}
        {typeof progress === 'number' && (
          <div className="w-full bg-gray-100 h-1">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </header>
  )
}

export default AppHeader

