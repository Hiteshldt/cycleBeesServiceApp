import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types based on the database schema
export interface Request {
  id: string
  short_slug: string
  order_id: string
  bike_name: string
  customer_name: string
  phone_digits_intl: string
  status: 'pending' | 'sent' | 'viewed' | 'confirmed' | 'cancelled'  // All 5 statuses supported
  subtotal_paise: number
  tax_paise: number
  total_paise: number
  lacarte_paise: number | null  // Custom La Carte price for this request (null = use global settings)
  created_at: string
  sent_at: string | null
  whatsapp_message_id: string | null
  whatsapp_sent_at: string | null
  whatsapp_error: string | null
}

export interface RequestItem {
  id: string
  request_id: string
  section: 'repair' | 'replacement'
  label: string
  price_paise: number
  is_suggested: boolean
}

export interface Addon {
  id: string
  name: string
  description: string | null
  price_paise: number
  is_active: boolean
  display_order: number
  created_at: string
}

export interface ServiceBundle {
  id: string
  name: string
  description: string | null
  price_paise: number
  bullet_points: string[]
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface ConfirmedOrderBundle {
  id: string
  request_id: string
  bundle_id: string
  selected_at: string
}

// Payment interface removed - estimates only, no payment processing
