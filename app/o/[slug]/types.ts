import type { Addon, Request, RequestItem, ServiceBundle } from '@/lib/supabase'
import type { LaCarteSettings } from '@/lib/lacarte'

export type OrderData = {
  request: Request
  items: (RequestItem & { selected?: boolean })[]
}

export type SelectionTotals = {
  subtotal: number
  addonsTotal: number
  bundlesTotal: number
  laCarteCharge: number
  total: number
}

export type ConfirmedData = {
  selectedItems: string[]
  selectedAddons: string[]
  selectedBundles: string[]
  totals: SelectionTotals
}

export type PublicOrderCollections = {
  addons: Addon[]
  bundles: ServiceBundle[]
}

export type SelectionSets = {
  items: Set<string>
  addons: Set<string>
  bundles: Set<string>
}

export type LaCarteState = {
  settings: LaCarteSettings | null
  pricePaise: number
}
