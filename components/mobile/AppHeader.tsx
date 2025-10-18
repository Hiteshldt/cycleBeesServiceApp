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
        {/* Row 1: Brand + Actions */}
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400">
          {/* Left: Logo/Back + Brand */}
          <div className="flex items-center gap-2">
            {showBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 rounded-full p-0 hover:bg-white/20 text-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Image
                src="/logo.png"
                alt="CycleBees Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            )}
            <span className="text-base font-bold text-gray-800">CycleBees</span>
          </div>

          {/* Right: Step + Help + Badge */}
          <div className="flex items-center gap-2">
            {step && (
              <span className="text-xs font-medium text-gray-800 px-2 py-1 bg-white/20 rounded-md">
                {step}
              </span>
            )}
            {onHelp && (
              <button
                onClick={onHelp}
                className="h-8 w-8 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <HeadphonesIcon className="h-4 w-4 text-gray-800" />
              </button>
            )}
            {rightSlot}
          </div>
        </div>

        {/* Row 2: Page Info */}
        <div className="px-4 py-2 bg-white/95">
          {title && (
            <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
          )}
          {subtitle && (
            <div className="text-xs text-gray-600 truncate mt-0.5">{subtitle}</div>
          )}
        </div>

        {/* Progress Bar */}
        {typeof progress === 'number' && (
          <div className="w-full bg-gray-200 h-1">
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

