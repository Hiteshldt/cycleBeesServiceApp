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
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-sm min-h-full">
      {/* Enhanced Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-2xl">
              <div className="text-2xl filter brightness-0 invert">🚴‍♂️</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            CycleBees
          </h1>
          <h2 className="text-lg font-semibold text-gray-700">
            {title || (billData.status === 'confirmed' ? 'Confirmed Service Order' : 'Service Estimate')}
          </h2>
          <p className="text-sm text-gray-600">🔧 Professional Doorstep Bike Service</p>
        </div>
      </div>

      {/* Enhanced Order Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">🆔 Order ID</div>
          <div className="font-bold text-blue-600">{billData.order_id}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            📅 {billData.status === 'confirmed' ? 'Confirmed Date' : 'Sent Date'}
          </div>
          <div className="font-semibold text-gray-800">
            {formatDate(billData.confirmed_at || billData.created_at)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">👤 Customer</div>
          <div className="font-semibold text-gray-800">{billData.customer_name}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">🚴‍♂️ Bike Model</div>
          <div className="font-semibold text-gray-800">{billData.bike_name}</div>
        </div>
      </div>

      {/* Enhanced Services Table */}
      <div className="mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 px-5 py-4 border-b border-gray-200/50">
            <h3 className="font-bold text-gray-900 text-base">📋 Service Details</h3>
          </div>

          <div className="divide-y divide-gray-200/50">
            {/* Repair Items */}
            {repairItems.length > 0 && (
              <>
                <div className="px-5 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400">
                  <div className="font-semibold text-red-800 text-sm flex items-center gap-2">
                    <span>🔧</span>
                    <span>REPAIR SERVICES</span>
                  </div>
                </div>
                {repairItems.map((item, index) => (
                  <div key={index} className="px-5 py-3 flex justify-between items-center hover:bg-blue-50/30 transition-colors">
                    <span className="flex-1 text-gray-800">{item.label}</span>
                    <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm">
                      {formatCurrency(item.price_paise)}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Replacement Items */}
            {replacementItems.length > 0 && (
              <>
                <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-400">
                  <div className="font-semibold text-purple-800 text-sm flex items-center gap-2">
                    <span>⚙️</span>
                    <span>REPLACEMENT PARTS</span>
                  </div>
                </div>
                {replacementItems.map((item, index) => (
                  <div key={index} className="px-5 py-3 flex justify-between items-center hover:bg-blue-50/30 transition-colors">
                    <span className="flex-1 text-gray-800">{item.label}</span>
                    <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm">
                      {formatCurrency(item.price_paise)}
                    </span>
                  </div>
                ))}
              </>
            )}
            
            {/* Add-ons */}
            {billData.addons.length > 0 && (
              <>
                <div className="px-5 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400">
                  <div className="font-semibold text-yellow-800 text-sm flex items-center gap-2">
                    <span>✨</span>
                    <span>PREMIUM ADD-ON SERVICES</span>
                  </div>
                </div>
                {billData.addons.map((addon, index) => (
                  <div key={index} className="px-5 py-3 hover:bg-blue-50/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{addon.name}</div>
                        {addon.description && (
                          <div className="text-sm text-gray-600 mt-1">{addon.description}</div>
                        )}
                      </div>
                      <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm ml-3">
                        {formatCurrency(addon.price_paise)}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Service Bundles */}
            {billData.bundles && billData.bundles.length > 0 && (
              <>
                <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-400">
                  <div className="font-semibold text-indigo-800 text-sm flex items-center gap-2">
                    <span>📦</span>
                    <span>SERVICE BUNDLES</span>
                  </div>
                </div>
                {billData.bundles.map((bundle, index) => (
                  <div key={index} className="px-5 py-3 hover:bg-blue-50/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{bundle.name}</div>
                        {bundle.description && (
                          <div className="text-sm text-gray-600 mt-1">{bundle.description}</div>
                        )}
                      </div>
                      <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm ml-3">
                        {formatCurrency(bundle.price_paise)}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* La Carte Service */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-emerald-800 flex items-center gap-2 mb-2">
                    <span>📦</span>
                    <span>La Carte Service Package</span>
                  </div>
                  <div className="text-sm text-emerald-700">
                    Includes doorstep pickup & delivery, basic tools & equipment
                  </div>
                </div>
                <span className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm ml-3">
                  {formatCurrency(billData.lacarte_paise)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Total Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-5 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-gray-700">
            <span className="flex items-center gap-2">
              <span>🔧</span>
              <span>Services Subtotal:</span>
            </span>
            <span className="font-semibold">{formatCurrency(billData.subtotal_paise)}</span>
          </div>
          {billData.addons_paise > 0 && (
            <div className="flex justify-between items-center text-gray-700">
              <span className="flex items-center gap-2">
                <span>✨</span>
                <span>Add-on Services:</span>
              </span>
              <span className="font-semibold">{formatCurrency(billData.addons_paise)}</span>
            </div>
          )}
          {billData.bundles_paise && billData.bundles_paise > 0 && (
            <div className="flex justify-between items-center text-gray-700">
              <span className="flex items-center gap-2">
                <span>📦</span>
                <span>Service Bundles:</span>
              </span>
              <span className="font-semibold">{formatCurrency(billData.bundles_paise)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-gray-700">
            <span className="flex items-center gap-2">
              <span>📦</span>
              <span>La Carte Package:</span>
            </span>
            <span className="font-semibold">{formatCurrency(billData.lacarte_paise)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold border-t-2 border-gradient-to-r from-blue-200 to-indigo-200 pt-4 text-gray-900">
            <span className="flex items-center gap-2">
              <span>💰</span>
              <span>Total Amount:</span>
            </span>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(billData.total_paise)}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Footer Note */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-5 text-center">
        <div className="space-y-3">
          <div className="flex items-center justify-center mb-3">
            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
          </div>
          <div className="text-sm text-gray-700">
            <strong className="text-gray-900">📋 Note:</strong> {billData.status === 'confirmed'
              ? 'This is a confirmed service order. Our technician will contact you to schedule the service.'
              : 'This is a service estimate. Final pricing may vary based on actual work required.'}
          </div>
          <div className="pt-3 border-t border-gray-200/50">
            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              🚴‍♂️ CycleBees
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Your bike, our care! | www.cyclebees.in
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
