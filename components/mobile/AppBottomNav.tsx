"use client"

import React from "react"
import { Wrench, Puzzle, Boxes, FileText } from "lucide-react"

type TabKey = "services" | "addons" | "bundles" | "summary"

type Props = {
  active: TabKey
  onChange: (tab: TabKey) => void
}

const tabs: { key: TabKey; label: string; Icon: any }[] = [
  { key: "services", label: "Services", Icon: Wrench },
  { key: "addons", label: "Add-ons", Icon: Puzzle },
  { key: "bundles", label: "Bundles", Icon: Boxes },
  { key: "summary", label: "Summary", Icon: FileText },
]

export function AppBottomNav({ active, onChange }: Props) {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto grid max-w-3xl grid-cols-4 py-2 text-xs">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex flex-col items-center gap-1 py-1 ${
                isActive ? "text-gray-900" : "text-gray-500"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  isActive
                    ? "border-[#FFD11E] bg-[#FFD11E]/20"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default AppBottomNav

