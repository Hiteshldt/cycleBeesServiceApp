import type { Request, RequestItem } from '@/lib/supabase'

type PriceSource = Pick<Request, 'subtotal_paise' | 'total_paise' | 'lacarte_paise' | 'status'>

type ItemLike = Pick<RequestItem, 'price_paise'> | { price_paise?: number | null }

interface CalculateRequestTotalsOptions {
  items?: ItemLike[] | null
  fallbackLaCartePaise?: number
}

export interface RequestTotalsResult {
  subtotal_paise: number
  total_paise: number
  la_carte_applied: number
}

// Normalizes totals for displaying/exporting requests without trusting stale DB values
export function calculateRequestTotals(
  source: PriceSource,
  options: CalculateRequestTotalsOptions = {}
): RequestTotalsResult {
  const subtotalFromItems =
    options.items && Array.isArray(options.items) && options.items.length > 0
      ? options.items.reduce((sum, item) => sum + (item?.price_paise ?? 0), 0)
      : null

  const subtotal_paise = subtotalFromItems ?? source.subtotal_paise ?? 0
  const laCartePaise = source.lacarte_paise ?? options.fallbackLaCartePaise ?? 0
  const derivedTotal = subtotal_paise + laCartePaise
  const storedTotal = source.total_paise ?? 0
  const total_paise = Math.max(storedTotal, derivedTotal)

  return {
    subtotal_paise,
    total_paise,
    la_carte_applied: laCartePaise,
  }
}
