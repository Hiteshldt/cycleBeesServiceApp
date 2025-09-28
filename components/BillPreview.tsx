'use client'

import React from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface BillItem {
  section: 'repair' | 'replacement'
  label: string
  price_paise: number
}

interface BillAddon {
  name: string
  description: string
  price_paise: number
}

interface BillBundle {
  name: string
  description: string | null
  price_paise: number
  bullet_points?: string[]
}

interface BillData {
  order_id: string
  customer_name: string
  bike_name: string
  created_at: string
  confirmed_at?: string
  items: BillItem[]
  addons: BillAddon[]
  bundles?: BillBundle[]
  subtotal_paise: number
  addons_paise: number
  bundles_paise?: number
  lacarte_paise: number
  total_paise: number
  status: string
}

interface BillPreviewProps {
  billData: BillData
  title?: string
}

export function BillPreview({ billData, title }: BillPreviewProps) {
  const repairItems = billData.items.filter(item => item.section === 'repair')
  const replacementItems = billData.items.filter(item => item.section === 'replacement')
  
  return (
    <div className="p-6 bg-white text-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-2xl font-bold text-gray-900 mb-2">🚴‍♂️ CycleBees</div>
        <div className="text-lg font-semibold text-gray-700 mb-1">
          {title || (billData.status === 'confirmed' ? 'Confirmed Service Order' : 'Service Estimate')}
        </div>
        <div className="text-sm text-gray-500">Professional Doorstep Bike Service</div>
      </div>

      {/* Order Information */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase">Order ID</div>
          <div className="font-semibold">{billData.order_id}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase">
            {billData.status === 'confirmed' ? 'Confirmed Date' : 'Sent Date'}
          </div>
          <div className="font-semibold">
            {formatDate(billData.confirmed_at || billData.created_at)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase">Customer</div>
          <div className="font-semibold">{billData.customer_name}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase">Bike Model</div>
          <div className="font-semibold">{billData.bike_name}</div>
        </div>
      </div>

      {/* Services Table */}
      <div className="mb-6">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Service Details</h3>
          </div>
          
          <div className="divide-y">
            {/* Repair Items */}
            {repairItems.length > 0 && (
              <>
                <div className="px-4 py-2 bg-red-50 font-medium text-red-800 text-xs">
                  🔧 REPAIR SERVICES
                </div>
                {repairItems.map((item, index) => (
                  <div key={index} className="px-4 py-3 flex justify-between">
                    <span className="flex-1">{item.label}</span>
                    <span className="font-semibold">{formatCurrency(item.price_paise)}</span>
                  </div>
                ))}
              </>
            )}
            
            {/* Replacement Items */}
            {replacementItems.length > 0 && (
              <>
                <div className="px-4 py-2 bg-purple-50 font-medium text-purple-800 text-xs">
                  🔩 REPLACEMENT PARTS
                </div>
                {replacementItems.map((item, index) => (
                  <div key={index} className="px-4 py-3 flex justify-between">
                    <span className="flex-1">{item.label}</span>
                    <span className="font-semibold">{formatCurrency(item.price_paise)}</span>
                  </div>
                ))}
              </>
            )}
            
            {/* Add-ons */}
            {billData.addons.length > 0 && (
              <>
                <div className="px-4 py-2 bg-yellow-50 font-medium text-yellow-800 text-xs">
                  ✨ PREMIUM ADD-ON SERVICES
                </div>
                {billData.addons.map((addon, index) => (
                  <div key={index} className="px-4 py-3">
                    <div className="flex justify-between">
                      <span className="flex-1 font-medium">{addon.name}</span>
                      <span className="font-semibold">{formatCurrency(addon.price_paise)}</span>
                    </div>
                    {addon.description && (
                      <div className="text-xs text-gray-600 mt-1">{addon.description}</div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Service Bundles */}
            {billData.bundles && billData.bundles.length > 0 && (
              <>
                <div className="px-4 py-2 bg-purple-50 font-medium text-purple-800 text-xs">
                  Service Bundles
                </div>
                {billData.bundles.map((bundle, index) => (
                  <div key={index} className="px-4 py-3">
                    <div className="flex justify-between">
                      <span className="flex-1 font-medium">{bundle.name}</span>
                      <span className="font-semibold">{formatCurrency(bundle.price_paise)}</span>
                    </div>
                    {bundle.description && (
                      <div className="text-xs text-gray-600 mt-1">{bundle.description}</div>
                    )}
                  </div>
                ))}
              </>
            )}
            
            {/* La Carte Service */}
            <div className="px-4 py-3 bg-blue-50">
              <div className="flex justify-between">
                <span className="flex-1 font-medium">📦 La Carte Service Package</span>
                <span className="font-semibold">{formatCurrency(billData.lacarte_paise)}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Includes doorstep pickup & delivery, basic tools & equipment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className="border-t-2 border-gray-200 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Services Subtotal:</span>
            <span>{formatCurrency(billData.subtotal_paise)}</span>
          </div>
          {billData.addons_paise > 0 && (
            <div className="flex justify-between">
              <span>Add-on Services:</span>
              <span>{formatCurrency(billData.addons_paise)}</span>
            </div>
          )}
          {billData.bundles_paise && billData.bundles_paise > 0 && (
            <div className="flex justify-between">
              <span>Service Bundles:</span>
              <span>{formatCurrency(billData.bundles_paise)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>La Carte Package:</span>
            <span>{formatCurrency(billData.lacarte_paise)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Amount:</span>
            <span>{formatCurrency(billData.total_paise)}</span>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-gray-50 rounded text-center text-xs text-gray-600">
        <strong>Note:</strong> {billData.status === 'confirmed' 
          ? 'This is a confirmed service order. Our technician will contact you to schedule the service.' 
          : 'This is a service estimate. Final pricing may vary based on actual work required.'}
        <div className="mt-2">
          <strong>🚴‍♂️ CycleBees</strong> - Your bike, our care! | www.cyclebees.in
        </div>
      </div>
    </div>
  )
}
