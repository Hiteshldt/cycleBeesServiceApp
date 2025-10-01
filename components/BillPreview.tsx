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
    <div className="p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-sm min-h-full">
      {/* Compact Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-20"></div>
          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl">
            <div className="text-lg filter brightness-0 invert">🚴‍♂️</div>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            CycleBees
          </h1>
          <h2 className="text-sm font-semibold text-gray-700">
            {title || (billData.status === 'confirmed' ? 'Confirmed Service Order' : 'Service Estimate')}
          </h2>
          <p className="text-xs text-gray-600">🔧 Professional Doorstep Bike Service</p>
        </div>
      </div>

      {/* Compact Order Information */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-gray-500">🆔 Order ID</div>
          <div className="font-bold text-blue-600 text-sm">{billData.order_id}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-gray-500">
            📅 {billData.status === 'confirmed' ? 'Confirmed' : 'Sent'}
          </div>
          <div className="font-semibold text-gray-800 text-sm">
            {formatDate(billData.confirmed_at || billData.created_at)}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-gray-500">👤 Customer</div>
          <div className="font-semibold text-gray-800 text-sm">{billData.customer_name}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-gray-500">🚴‍♂️ Bike</div>
          <div className="font-semibold text-gray-800 text-sm">{billData.bike_name}</div>
        </div>
      </div>

      {/* Compact Services Table */}
      <div className="mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 px-3 py-2 border-b border-gray-200/50">
            <h3 className="font-bold text-gray-900 text-sm">📋 Service Details</h3>
          </div>

          <div className="divide-y divide-gray-200/50">
            {/* Repair Items */}
            {repairItems.length > 0 && (
              <>
                <div className="px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 border-l-3 border-red-400">
                  <div className="font-semibold text-red-800 text-xs flex items-center gap-1">
                    <span>🔧</span>
                    <span>REPAIR SERVICES</span>
                  </div>
                </div>
                {repairItems.map((item, index) => (
                  <div key={index} className="px-3 py-2 flex justify-between items-center hover:bg-blue-50/30 transition-colors">
                    <span className="flex-1 text-gray-800 text-sm">{item.label}</span>
                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                      {formatCurrency(item.price_paise)}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Replacement Items */}
            {replacementItems.length > 0 && (
              <>
                <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-3 border-purple-400">
                  <div className="font-semibold text-purple-800 text-xs flex items-center gap-1">
                    <span>⚙️</span>
                    <span>REPLACEMENT PARTS</span>
                  </div>
                </div>
                {replacementItems.map((item, index) => (
                  <div key={index} className="px-3 py-2 flex justify-between items-center hover:bg-blue-50/30 transition-colors">
                    <span className="flex-1 text-gray-800 text-sm">{item.label}</span>
                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                      {formatCurrency(item.price_paise)}
                    </span>
                  </div>
                ))}
              </>
            )}
            
            {/* Add-ons */}
            {billData.addons.length > 0 && (
              <>
                <div className="px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-3 border-yellow-400">
                  <div className="font-semibold text-yellow-800 text-xs flex items-center gap-1">
                    <span>✨</span>
                    <span>ADD-ON SERVICES</span>
                  </div>
                </div>
                {billData.addons.map((addon, index) => (
                  <div key={index} className="px-3 py-2 hover:bg-blue-50/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{addon.name}</div>
                        {addon.description && (
                          <div className="text-xs text-gray-600 mt-0.5">{addon.description}</div>
                        )}
                      </div>
                      <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs ml-2">
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
                <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-3 border-indigo-400">
                  <div className="font-semibold text-indigo-800 text-xs flex items-center gap-1">
                    <span>📦</span>
                    <span>SERVICE BUNDLES</span>
                  </div>
                </div>
                {billData.bundles.map((bundle, index) => (
                  <div key={index} className="px-3 py-2 hover:bg-blue-50/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{bundle.name}</div>
                        {bundle.description && (
                          <div className="text-xs text-gray-600 mt-0.5">{bundle.description}</div>
                        )}
                      </div>
                      <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs ml-2">
                        {formatCurrency(bundle.price_paise)}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* La Carte Service */}
            <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border-l-3 border-emerald-400">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1 text-sm">
                    <span>📦</span>
                    <span>La Carte Package</span>
                  </div>
                  <div className="text-xs text-emerald-700">
                    Doorstep pickup & delivery, tools & equipment
                  </div>
                </div>
                <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs ml-2">
                  {formatCurrency(billData.lacarte_paise)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Total Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-gray-700 text-sm">
            <span className="flex items-center gap-1">
              <span>🔧</span>
              <span>Services:</span>
            </span>
            <span className="font-semibold">{formatCurrency(billData.subtotal_paise)}</span>
          </div>
          {billData.addons_paise > 0 && (
            <div className="flex justify-between items-center text-gray-700 text-sm">
              <span className="flex items-center gap-1">
                <span>✨</span>
                <span>Add-ons:</span>
              </span>
              <span className="font-semibold">{formatCurrency(billData.addons_paise)}</span>
            </div>
          )}
          {billData.bundles_paise && billData.bundles_paise > 0 && (
            <div className="flex justify-between items-center text-gray-700 text-sm">
              <span className="flex items-center gap-1">
                <span>📦</span>
                <span>Bundles:</span>
              </span>
              <span className="font-semibold">{formatCurrency(billData.bundles_paise)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-gray-700 text-sm">
            <span className="flex items-center gap-1">
              <span>📦</span>
              <span>La Carte:</span>
            </span>
            <span className="font-semibold">{formatCurrency(billData.lacarte_paise)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2 text-gray-900">
            <span className="flex items-center gap-1">
              <span>💰</span>
              <span>Total:</span>
            </span>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(billData.total_paise)}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Footer Note */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3 text-center">
        <div className="space-y-2">
          <div className="text-xs text-gray-700">
            <strong className="text-gray-900">📋 Note:</strong> {billData.status === 'confirmed'
              ? 'Confirmed order - technician will contact you.'
              : 'Estimate only - final pricing may vary.'}
          </div>
          <div className="pt-2 border-t border-gray-200/50">
            <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              🚴‍♂️ CycleBees
            </div>
            <div className="text-xs text-gray-600">
              Your bike, our care! | www.cyclebees.in
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
