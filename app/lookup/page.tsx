'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Search, MessageCircle } from 'lucide-react'
import { AppHeader } from '@/components/mobile/AppHeader'
import { openWhatsApp } from '@/lib/utils'

export default function RequestLookup() {
  const [orderId, setOrderId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId.trim()) {
      setError('Please enter an Order ID')
      return
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Call API to find request by order ID and phone number
      const response = await fetch(`/api/public/lookup?orderId=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(phoneNumber.trim())}`)
      
      if (response.ok) {
        const data = await response.json()
        // Redirect to the order page using the short slug
        router.push(`/o/${data.shortSlug}`)
      } else if (response.status === 404) {
        setError('Order not found. Please check your Order ID and phone number.')
      } else {
        setError('Failed to lookup order. Please try again.')
      }
    } catch (error) {
      console.error('Lookup error:', error)
      setError('Failed to lookup order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Find Your Order" subtitle="CycleBees • Bike Service" />

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 text-center">
            <h2 className="text-base font-bold text-gray-900">Look up your service estimate</h2>
            <p className="mt-1 text-[13px] text-gray-600">Enter your Order ID and phone number</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center rounded-md border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="CBYYMMDDHHMMXX"
                className="h-12 text-center font-mono text-base"
              />
              <p className="mt-1 text-[12px] text-gray-500">Starts with CB and includes date/time code</p>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+</span>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="7005192650"
                  className="h-12 pl-8 text-base"
                  maxLength={15}
                />
              </div>
              <p className="mt-1 text-[12px] text-gray-500">10 digits; 91 will be added automatically</p>
            </div>

            <Button type="submit" className="h-12 w-full bg-[#FFD11E] text-gray-900 hover:bg-[#ffd633]" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? 'Searching…' : 'Find My Order'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-gray-500">
            <button
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-gray-700"
              onClick={() => openWhatsApp('919597312212', 'Hi, I need help finding my CycleBees order.')}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Need help?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
