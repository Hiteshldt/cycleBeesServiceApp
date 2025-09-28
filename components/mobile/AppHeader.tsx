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
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 bg-gradient-to-r from-yellow-400 to-orange-400">
          {/* Left: Back Button */}
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 rounded-full p-0 hover:bg-white/20 text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Center: CycleBees Logo */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {/* CycleBees Logo Image */}
            <Image
              src="/logo.png"
              alt="CycleBees Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
            <div>
              <div className="text-lg font-bold text-gray-800">CycleBees</div>
            </div>
          </div>

          {/* Right: Help Button */}
          <div className="flex items-center gap-1">
            {onHelp && (
              <button
                onClick={onHelp}
                className="h-8 w-8 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <HeadphonesIcon className="h-4 w-4 text-gray-800" />
              </button>
            )}
            {rightSlot && <div className="ml-1">{rightSlot}</div>}
          </div>
        </div>

        {/* Page Info */}
        <div className="px-4 py-4 bg-white">
          <div className="text-center">
            {title && (
              <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
            )}
            {subtitle && (
              <p className="text-base text-gray-700 font-medium">{subtitle}</p>
            )}
          </div>

          {/* Progress Bar */}
          {typeof progress === 'number' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                {step && (
                  <span className="text-xs font-medium text-gray-500">{step}</span>
                )}
                <span className="text-xs font-medium text-blue-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader

