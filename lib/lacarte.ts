// La Carte pricing utilities
export interface LaCarteSettings {
  id: string
  real_price_paise: number
  current_price_paise: number
  discount_note: string
  is_active?: boolean
}

// Cache for La Carte settings to avoid repeated API calls
let laCarteCache: LaCarteSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60000 // 1 minute

// Get current La Carte pricing
export async function getLaCartePrice(): Promise<number> {
  const settings = await getLaCarteSettings()
  return settings.current_price_paise
}

// Get full La Carte settings
export async function getLaCarteSettings(): Promise<LaCarteSettings> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (laCarteCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return laCarteCache
  }
  
  try {
    // For server-side, use direct API call
    if (typeof window === 'undefined') {
      const { supabase } = await import('./supabase')
      const { data, error } = await supabase
        .from('lacarte_settings')
        .select('*')
        .eq('id', 'lacarte')
        .single()
        
      if (error) {
        console.warn('La Carte settings not found, using defaults:', error)
        return getDefaultSettings()
      }
      
      laCarteCache = data
      cacheTimestamp = now
      return data
    } else {
      // For client-side, prefer API; fallback to direct Supabase read
      try {
        const response = await fetch('/api/admin/lacarte')
        if (response.ok) {
          const data = await response.json()
          laCarteCache = data
          cacheTimestamp = now
          return data
        }
      } catch {
        // ignore and try direct supabase
      }

      try {
        const { supabase } = await import('./supabase')
        const { data, error } = await supabase
          .from('lacarte_settings')
          .select('*')
          .eq('id', 'lacarte')
          .single()

        if (error || !data) {
          console.warn('Failed to fetch La Carte via Supabase, using defaults', error)
          return getDefaultSettings()
        }

        laCarteCache = data
        cacheTimestamp = now
        return data
      } catch (err) {
        console.warn('Error fetching La Carte settings on client, using defaults:', err)
        return getDefaultSettings()
      }
    }
  } catch (error) {
    console.warn('Error fetching La Carte settings, using defaults:', error)
    return getDefaultSettings()
  }
}

// Get default settings
function getDefaultSettings(): LaCarteSettings {
  return {
    id: 'lacarte',
    real_price_paise: 9900,
    current_price_paise: 9900,
    discount_note: '',
    is_active: true
  }
}

// Clear cache (useful when settings are updated)
export function clearLaCarteCache() {
  laCarteCache = null
  cacheTimestamp = 0
}

// Calculate discount percentage
export function calculateDiscountPercentage(settings: LaCarteSettings): number {
  if (settings.real_price_paise <= settings.current_price_paise) return 0
  return Math.round(((settings.real_price_paise - settings.current_price_paise) / settings.real_price_paise) * 100)
}

// Format La Carte display with discount info
export function formatLaCarteDisplay(settings: LaCarteSettings): {
  currentPrice: number
  originalPrice?: number
  discountPercentage?: number
  discountNote?: string
  hasDiscount: boolean
} {
  const hasDiscount = settings.real_price_paise > settings.current_price_paise
  
  return {
    currentPrice: settings.current_price_paise,
    originalPrice: hasDiscount ? settings.real_price_paise : undefined,
    discountPercentage: hasDiscount ? calculateDiscountPercentage(settings) : undefined,
    discountNote: settings.discount_note || undefined,
    hasDiscount
  }
}
