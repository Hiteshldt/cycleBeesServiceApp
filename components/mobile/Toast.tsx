"use client"

import React from "react"

type Toast = { id: number; message: string; tone?: "default" | "success" | "error" }

let toastId = 1

export function showToast(message: string, tone: Toast["tone"] = "default") {
  if (typeof window === "undefined") return
  const detail: Toast = { id: toastId++, message, tone }
  window.dispatchEvent(new CustomEvent("app-toast", { detail }))
}

export function ToastHost() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    function onToast(e: Event) {
      const ce = e as CustomEvent<Toast>
      setToasts((prev) => [...prev, ce.detail])
      // Auto-remove after 2.5s
      const id = ce.detail.id
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2500)
    }
    window.addEventListener("app-toast", onToast as any)
    return () => window.removeEventListener("app-toast", onToast as any)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] mx-auto flex max-w-sm flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-md backdrop-blur ${
            t.tone === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
              : t.tone === "error"
              ? "border-red-200 bg-red-50/90 text-red-900"
              : "border-gray-200 bg-white/90 text-gray-900"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default ToastHost

