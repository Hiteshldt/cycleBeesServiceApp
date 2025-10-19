/**
 * Script to verify database schema for la-carte issue
 * Run with: npx tsx scripts/verify-database-schema.ts
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
  console.log('🔍 Verifying Database Schema for La-Carte Issue\n')
  console.log('='.repeat(70))

  // 1. Check if lacarte_paise column exists in requests table
  console.log('\n1️⃣  Checking requests table columns...')
  try {
    const { data: sampleRequest, error } = await supabase
      .from('requests')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error querying requests:', error.message)
    } else if (sampleRequest) {
      console.log('✅ Successfully queried requests table')
      console.log('   Columns present:', Object.keys(sampleRequest).join(', '))
      console.log('\n   Key columns check:')
      console.log(
        '   - lacarte_paise:',
        sampleRequest.hasOwnProperty('lacarte_paise') ? '✅ EXISTS' : '❌ MISSING'
      )
      console.log(
        '   - total_paise:',
        sampleRequest.hasOwnProperty('total_paise') ? '✅ EXISTS' : '❌ MISSING'
      )
      console.log(
        '   - subtotal_paise:',
        sampleRequest.hasOwnProperty('subtotal_paise') ? '✅ EXISTS' : '❌ MISSING'
      )
    } else {
      console.log('⚠️  No requests in database yet')
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }

  // 2. Check if lacarte_settings table exists
  console.log('\n2️⃣  Checking lacarte_settings table...')
  try {
    const { data: lacarteSettings, error } = await supabase
      .from('lacarte_settings')
      .select('*')
      .eq('id', 'lacarte')
      .single()

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ lacarte_settings table DOES NOT EXIST')
      } else if (error.code === 'PGRST116') {
        console.log('⚠️  lacarte_settings table exists but no data with id="lacarte"')
      } else {
        console.error('❌ Error:', error.message, error.code)
      }
    } else {
      console.log('✅ lacarte_settings table exists and has data')
      console.log('   Settings:', JSON.stringify(lacarteSettings, null, 2))
    }
  } catch (err: any) {
    console.error('❌ Error:', err.message)
  }

  // 3. Check actual data - compare total_paise vs calculated total
  console.log('\n3️⃣  Checking actual request totals...')
  try {
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
        request_items (
          price_paise
        )
      `
      )
      .limit(5)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error:', error.message)
    } else if (requests && requests.length > 0) {
      console.log(`✅ Found ${requests.length} recent requests\n`)

      requests.forEach((req: any, idx: number) => {
        const itemsTotal =
          req.request_items?.reduce((sum: number, item: any) => sum + item.price_paise, 0) || 0
        const lacarteValue = req.lacarte_paise || 0
        const expectedTotal = itemsTotal + lacarteValue
        const actualTotal = req.total_paise
        const matches = expectedTotal === actualTotal

        console.log(`   Request ${idx + 1}: ${req.order_id} (${req.status})`)
        console.log(
          `   - Items total:      ₹${(itemsTotal / 100).toFixed(2)} (${itemsTotal} paise)`
        )
        console.log(
          `   - La-carte value:   ₹${(lacarteValue / 100).toFixed(2)} (${lacarteValue} paise)`
        )
        console.log(
          `   - Expected total:   ₹${(expectedTotal / 100).toFixed(2)} (${expectedTotal} paise)`
        )
        console.log(
          `   - Actual total:     ₹${(actualTotal / 100).toFixed(2)} (${actualTotal} paise)`
        )
        console.log(
          `   - Match:            ${matches ? '✅ CORRECT' : '❌ WRONG - Difference: ' + (actualTotal - expectedTotal) + ' paise'}`
        )
        console.log()
      })
    } else {
      console.log('⚠️  No requests found in database')
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }

  // 4. Check database trigger
  console.log('\n4️⃣  Checking database trigger (via SQL)...')
  try {
    // This query might not work with anon key, but worth trying
    const { data, error } = await supabase.rpc('get_function_definition', {
      function_name: 'update_request_totals',
    })

    if (error) {
      console.log('⚠️  Cannot read trigger definition with current permissions')
      console.log('   Error:', error.message)
    } else {
      console.log('✅ Trigger definition:', data)
    }
  } catch (_err) {
    console.log('⚠️  Cannot verify trigger (permission issue)')
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ Verification Complete\n')
}

// Run verification
verifySchema()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
