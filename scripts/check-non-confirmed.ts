/**
 * Check non-confirmed requests to see if they have the lacarte issue
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNonConfirmed() {
  console.log('🔍 Checking Non-Confirmed Requests for La-Carte Issue\n')

  // Get non-confirmed requests
  const { data: requests, error } = await supabase
    .from('requests')
    .select(
      `
      id,
      order_id,
      status,
      lacarte_paise,
      subtotal_paise,
      total_paise,
      created_at,
      request_items (
        price_paise
      )
    `
    )
    .in('status', ['pending', 'sent', 'viewed'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!requests || requests.length === 0) {
    console.log('⚠️  No non-confirmed requests found')
    return
  }

  console.log(`Found ${requests.length} non-confirmed requests:\n`)

  let issueCount = 0

  requests.forEach((req: any, idx: number) => {
    const itemsTotal =
      req.request_items?.reduce((sum: number, item: any) => sum + item.price_paise, 0) || 0
    const lacarteValue = req.lacarte_paise || 0
    const expectedWithLacarte = itemsTotal + lacarteValue
    const expectedWithoutLacarte = itemsTotal
    const actualTotal = req.total_paise

    const matchesWithLacarte = expectedWithLacarte === actualTotal
    const matchesWithoutLacarte = expectedWithoutLacarte === actualTotal

    console.log(`${idx + 1}. ${req.order_id} (${req.status})`)
    console.log(`   Created: ${new Date(req.created_at).toLocaleString()}`)
    console.log(`   Items total:          ₹${(itemsTotal / 100).toFixed(2)}`)
    console.log(`   La-carte value:       ₹${(lacarteValue / 100).toFixed(2)}`)
    console.log(`   Stored total_paise:   ₹${(actualTotal / 100).toFixed(2)}`)
    console.log(`   Expected (with LC):   ₹${(expectedWithLacarte / 100).toFixed(2)}`)
    console.log(`   Expected (no LC):     ₹${(expectedWithoutLacarte / 100).toFixed(2)}`)

    if (matchesWithLacarte) {
      console.log(`   ✅ CORRECT: Includes la-carte`)
    } else if (matchesWithoutLacarte) {
      console.log(`   ❌ PROBLEM: Missing la-carte (${(lacarteValue / 100).toFixed(2)} short)`)
      issueCount++
    } else {
      console.log(
        `   ⚠️  UNKNOWN: Neither calculation matches (diff: ₹${((actualTotal - expectedWithLacarte) / 100).toFixed(2)})`
      )
    }
    console.log()
  })

  console.log('='.repeat(70))
  console.log(`Summary: ${issueCount}/${requests.length} requests missing la-carte in total_paise`)
  console.log('='.repeat(70))
}

checkNonConfirmed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
