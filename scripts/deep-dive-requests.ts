/**
 * Deep dive into request #2 that shows wrong total
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function deepDive() {
  console.log('🔬 Deep Dive: Request CB251019003717\n')

  // Get the problematic request with all details
  const { data: request, error } = await supabase
    .from('requests')
    .select(
      `
      *,
      request_items (
        id,
        section,
        label,
        price_paise
      )
    `
    )
    .eq('order_id', 'CB251019003717')
    .single()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('📋 Request Details:')
  console.log('   Order ID:', request.order_id)
  console.log('   Status:', request.status)
  console.log('   Created:', request.created_at)
  console.log()

  console.log('💰 Stored Totals:')
  console.log(
    '   subtotal_paise:',
    request.subtotal_paise,
    `(₹${(request.subtotal_paise / 100).toFixed(2)})`
  )
  console.log(
    '   lacarte_paise:',
    request.lacarte_paise,
    `(₹${((request.lacarte_paise || 0) / 100).toFixed(2)})`
  )
  console.log(
    '   total_paise:',
    request.total_paise,
    `(₹${(request.total_paise / 100).toFixed(2)})`
  )
  console.log()

  console.log('🔧 Request Items:')
  const itemsTotal =
    request.request_items?.reduce((sum: number, item: any) => sum + item.price_paise, 0) || 0
  request.request_items?.forEach((item: any) => {
    console.log(`   - ${item.label}: ₹${(item.price_paise / 100).toFixed(2)}`)
  })
  console.log(`   Items Total: ₹${(itemsTotal / 100).toFixed(2)} (${itemsTotal} paise)`)
  console.log()

  // Get confirmed selections
  const { data: confirmedServices } = await supabase
    .from('confirmed_order_services')
    .select('service_item_id')
    .eq('request_id', request.id)

  const { data: confirmedAddons } = await supabase
    .from('confirmed_order_addons')
    .select(
      `
      addon_id,
      addons (
        name,
        price_paise
      )
    `
    )
    .eq('request_id', request.id)

  const { data: confirmedBundles } = await supabase
    .from('confirmed_order_bundles')
    .select(
      `
      bundle_id,
      service_bundles (
        name,
        price_paise
      )
    `
    )
    .eq('request_id', request.id)

  console.log('✅ Confirmed Selections:')
  console.log(`   Services: ${confirmedServices?.length || 0} items`)
  confirmedServices?.forEach((s: any) => {
    const item = request.request_items?.find((i: any) => i.id === s.service_item_id)
    if (item) {
      console.log(`     - ${item.label}: ₹${(item.price_paise / 100).toFixed(2)}`)
    }
  })

  const addonsTotal =
    confirmedAddons?.reduce((sum, a: any) => sum + (a.addons?.price_paise || 0), 0) || 0
  console.log(
    `   Addons: ${confirmedAddons?.length || 0} items (Total: ₹${(addonsTotal / 100).toFixed(2)})`
  )
  confirmedAddons?.forEach((a: any) => {
    console.log(`     - ${a.addons?.name}: ₹${((a.addons?.price_paise || 0) / 100).toFixed(2)}`)
  })

  const bundlesTotal =
    confirmedBundles?.reduce((sum, b: any) => sum + (b.service_bundles?.price_paise || 0), 0) || 0
  console.log(
    `   Bundles: ${confirmedBundles?.length || 0} items (Total: ₹${(bundlesTotal / 100).toFixed(2)})`
  )
  confirmedBundles?.forEach((b: any) => {
    console.log(
      `     - ${b.service_bundles?.name}: ₹${((b.service_bundles?.price_paise || 0) / 100).toFixed(2)}`
    )
  })

  console.log()
  console.log('🧮 Calculation Check:')

  // Calculate based on CONFIRMED selections
  const confirmedItemsTotal =
    confirmedServices?.reduce((sum, s: any) => {
      const item = request.request_items?.find((i: any) => i.id === s.service_item_id)
      return sum + (item?.price_paise || 0)
    }, 0) || 0

  const lacarteValue = request.lacarte_paise || 9900
  const expectedTotal = confirmedItemsTotal + addonsTotal + bundlesTotal + lacarteValue

  console.log('   Based on ALL items in request:')
  console.log(`     Items: ₹${(itemsTotal / 100).toFixed(2)}`)
  console.log(`     La-carte: ₹${(lacarteValue / 100).toFixed(2)}`)
  console.log(`     Expected: ₹${((itemsTotal + lacarteValue) / 100).toFixed(2)}`)
  console.log()
  console.log('   Based on CONFIRMED selections:')
  console.log(`     Confirmed Items: ₹${(confirmedItemsTotal / 100).toFixed(2)}`)
  console.log(`     Addons: ₹${(addonsTotal / 100).toFixed(2)}`)
  console.log(`     Bundles: ₹${(bundlesTotal / 100).toFixed(2)}`)
  console.log(`     La-carte: ₹${(lacarteValue / 100).toFixed(2)}`)
  console.log(`     Expected: ₹${(expectedTotal / 100).toFixed(2)}`)
  console.log()
  console.log(`   Stored in DB: ₹${(request.total_paise / 100).toFixed(2)}`)
  console.log()

  if (expectedTotal === request.total_paise) {
    console.log(
      '✅ MATCH: Database total is correct (includes confirmed selections + addons + bundles + lacarte)'
    )
  } else {
    console.log(
      `❌ MISMATCH: Difference of ₹${((request.total_paise - expectedTotal) / 100).toFixed(2)}`
    )
  }
}

deepDive()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
