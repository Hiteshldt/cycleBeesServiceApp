'use client'

import { Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/mobile/AppHeader'
import { CategorySection } from '@/components/mobile/CategorySection'
import { SelectionCard } from '@/components/mobile/SelectionCard'
import { StickyActionBar } from '@/components/mobile/StickyActionBar'
import { formatCurrency } from '@/lib/utils'
import type { Addon, Request, RequestItem, ServiceBundle } from '@/lib/supabase'
import type { LaCarteSettings } from '@/lib/lacarte'

import { getLaCarteDisplay } from '../hooks/usePublicOrderController'
import type { SelectionTotals } from '../types'

type ReviewOrderViewProps = {
  request: Request
  items: (RequestItem & { selected?: boolean })[]
  addons: Addon[]
  bundles: ServiceBundle[]
  selectedItems: Set<string>
  selectedAddons: Set<string>
  selectedBundles: Set<string>
  laCarte: LaCarteSettings | null
  laCartePaise: number
  totals: SelectionTotals
  onNeedHelp: () => void
  onConfirm: () => void
  onBack: () => void
}

export function ReviewOrderView({
  request,
  items,
  addons,
  bundles,
  selectedItems,
  selectedAddons,
  selectedBundles,
  laCarte,
  laCartePaise,
  totals,
  onNeedHelp,
  onConfirm,
  onBack,
}: ReviewOrderViewProps) {
  const repairItems = items.filter((item) => item.section === 'repair')
  const replacementItems = items.filter((item) => item.section === 'replacement')

  const laCarteDisplay = getLaCarteDisplay(laCarte)

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <AppHeader
        title="Review Your Order"
        subtitle="Double-check your selections before confirming"
        progress={100}
        showBack={true}
        onBack={onBack}
        onHelp={onNeedHelp}
      />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-medium text-blue-900 mb-1">Service Estimate Ready</h2>
              <p className="text-sm text-blue-700">Review your selections below</p>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-blue-600 font-medium">Customer</p>
                <p className="text-blue-900 font-medium">{request.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Bike</p>
                <p className="text-blue-900 font-medium">{request.bike_name}</p>
              </div>
            </div>
          </div>
        </div>

        {repairItems.filter((item) => selectedItems.has(item.id)).length > 0 && (
          <CategorySection
            title="Repair Services"
            emoji="🔧"
            description="Selected essential fixes for your bike"
            count={repairItems.filter((item) => selectedItems.has(item.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {repairItems
                .filter((item) => selectedItems.has(item.id))
                .map((item) => (
                  <SelectionCard
                    key={item.id}
                    id={item.id}
                    title={item.label}
                    price={item.price_paise}
                    isSelected={true}
                    isRecommended={item.is_suggested}
                    isRequired={true}
                    type="repair"
                    onToggle={() => {}}
                  />
                ))}
            </div>
          </CategorySection>
        )}

        {replacementItems.filter((item) => selectedItems.has(item.id)).length > 0 && (
          <CategorySection
            title="Replacement Parts"
            emoji="⚙️"
            description="Selected new parts for better performance"
            count={replacementItems.filter((item) => selectedItems.has(item.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {replacementItems
                .filter((item) => selectedItems.has(item.id))
                .map((item) => (
                  <SelectionCard
                    key={item.id}
                    id={item.id}
                    title={item.label}
                    price={item.price_paise}
                    isSelected={true}
                    isRecommended={item.is_suggested}
                    isRequired={true}
                    type="replacement"
                    onToggle={() => {}}
                  />
                ))}
            </div>
          </CategorySection>
        )}

        {addons.filter((addon) => selectedAddons.has(addon.id)).length > 0 && (
          <CategorySection
            title="Add-on Services"
            emoji="✨"
            description="Selected premium services to enhance your bike care"
            count={addons.filter((addon) => selectedAddons.has(addon.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {addons
                .filter((addon) => selectedAddons.has(addon.id))
                .map((addon) => (
                  <SelectionCard
                    key={addon.id}
                    id={addon.id}
                    title={addon.name}
                    description={addon.description || undefined}
                    price={addon.price_paise}
                    isSelected={true}
                    isRequired={true}
                    type="addon"
                    onToggle={() => {}}
                  />
                ))}
            </div>
          </CategorySection>
        )}

        {bundles.filter((bundle) => selectedBundles.has(bundle.id)).length > 0 && (
          <CategorySection
            title="Service Bundles"
            emoji="📦"
            description="Selected comprehensive packages with multiple services"
            count={bundles.filter((bundle) => selectedBundles.has(bundle.id)).length}
            isCollapsible={false}
          >
            <div className="space-y-3">
              {bundles
                .filter((bundle) => selectedBundles.has(bundle.id))
                .map((bundle) => (
                  <SelectionCard
                    key={bundle.id}
                    id={bundle.id}
                    title={bundle.name}
                    description={bundle.description || undefined}
                    price={bundle.price_paise}
                    isSelected={true}
                    isRequired={true}
                    type="bundle"
                    bulletPoints={bundle.bullet_points}
                    onToggle={() => {}}
                  />
                ))}
            </div>
          </CategorySection>
        )}

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-green-900 mb-1">
                  La Carte Service (Fixed Charges - Free Services Included below)
                </h3>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {laCarte && laCarte.real_price_paise > laCartePaise ? (
                <div className="space-y-1">
                  <div className="text-lg font-bold text-green-700">
                    {formatCurrency(laCartePaise)}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-500 font-medium">MRP</span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(laCarte.real_price_paise)}
                    </span>
                  </div>
                  <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold inline-block">
                    {Math.round(
                      ((laCarte.real_price_paise - laCartePaise) /
                        Math.max(laCarte.real_price_paise, 1)) *
                        100
                    )}
                    % off
                  </div>
                </div>
              ) : (
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(laCartePaise)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-3">
            <div className="grid grid-cols-1 gap-2 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>General service & inspection report</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Full cleaning & wash</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Tyre puncture check & air filling</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Oiling & lubrication service</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Tightening of loose parts</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Pick & drop or doorstep service</span>
              </div>
            </div>
          </div>
        </div>

        <CategorySection
          title="Order Summary"
          emoji="📋"
          description="Complete breakdown of confirmed services"
          isCollapsible={false}
        >
          <div className="space-y-2 text-sm">
            {totals.subtotal > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Selected Services ({selectedItems.size} items)</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
            )}
            {totals.addonsTotal > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Add-on Services ({selectedAddons.size} items)</span>
                <span className="font-medium">{formatCurrency(totals.addonsTotal)}</span>
              </div>
            )}
            {totals.bundlesTotal > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Service Bundles ({selectedBundles.size} items)</span>
                <span className="font-medium">{formatCurrency(totals.bundlesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>La Carte Services (Fixed)</span>
              <span className="font-medium">{formatCurrency(laCartePaise)}</span>
            </div>
            <div className="border-t pt-2 mt-3">
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total Amount (GST Inclusive)</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </CategorySection>

        <div className="h-32" />
      </div>

      <StickyActionBar
        totalPaise={totals.total}
        primaryLabel="Confirm Order"
        onPrimary={onConfirm}
        selectedCount={selectedItems.size + selectedAddons.size + selectedBundles.size}
        summaryText="Review selections and confirm to schedule your service"
        isExpandable={true}
        servicesBreakdown={{
          selectedServicesPaise: totals.subtotal + totals.addonsTotal + totals.bundlesTotal,
          selectedCount: selectedItems.size + selectedAddons.size + selectedBundles.size,
          laCartePaise,
          laCarteDisplay,
        }}
      />

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 p-3">
        <div className="max-w-md mx-auto">
          <Button
            onClick={onNeedHelp}
            variant="outline"
            className="w-full h-10 text-sm border-gray-300 text-gray-600"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Need Help?
          </Button>
        </div>
      </div>
    </div>
  )
}
