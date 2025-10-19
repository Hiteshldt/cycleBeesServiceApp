/**
 * Test the database trigger by creating a test request
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testTrigger() {
  console.log('🧪 Testing Database Trigger for La-Carte Issue\n')

  console.log('1️⃣  Creating test request directly in database with:')
  console.log('   - La-carte: ₹99 (9900 paise)')
  console.log('   - Items: ₹250 (25000 paise)')
  console.log('   - Expected total: ₹349 (34900 paise)')
  console.log()

  // Create request directly via Supabase
  const { data: newRequest, error: requestError } = await supabase
    .from('requests')
    .insert([
      {
        order_id: `TEST-TRIGGER-${Date.now()}`,
        bike_name: 'Test Bike',
        customer_name: 'Test Customer',
        phone_digits_intl: '919999999999',
        status: 'pending',
        lacarte_paise: 9900, // Set la-carte to ₹99
      },
    ])
    .select()
    .single()

  if (requestError) {
    console.error('❌ Failed to create request:', requestError)
    return
  }

  console.log('✅ Request created:', newRequest.id)

  // Insert items
  const { error: itemsError } = await supabase.from('request_items').insert([
    {
      request_id: newRequest.id,
      section: 'repair',
      label: 'Test Repair Item 1',
      price_paise: 10000,
      is_suggested: true,
    },
    {
      request_id: newRequest.id,
      section: 'repair',
      label: 'Test Repair Item 2',
      price_paise: 15000,
      is_suggested: true,
    },
  ])

  if (itemsError) {
    console.error('❌ Failed to create items:', itemsError)
    await supabase.from('requests').delete().eq('id', newRequest.id)
    return
  }

  console.log('✅ Items created')
  console.log()

  const result = { id: newRequest.id }

  // Wait a bit for trigger to execute
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Fetch the created request
  const { data: createdRequest, error } = await supabase
    .from('requests')
    .select(
      `
      *,
      request_items (
        price_paise
      )
    `
    )
    .eq('id', result.id)
    .single()

  if (error) {
    console.error('❌ Error fetching request:', error)
    return
  }

  console.log('2️⃣  Checking saved values in database:')
  console.log(
    `   - lacarte_paise: ${createdRequest.lacarte_paise} paise (₹${(createdRequest.lacarte_paise / 100).toFixed(2)})`
  )
  console.log(
    `   - subtotal_paise: ${createdRequest.subtotal_paise} paise (₹${(createdRequest.subtotal_paise / 100).toFixed(2)})`
  )
  console.log(
    `   - total_paise: ${createdRequest.total_paise} paise (₹${(createdRequest.total_paise / 100).toFixed(2)})`
  )
  console.log()

  const itemsTotal =
    createdRequest.request_items?.reduce((sum: number, item: any) => sum + item.price_paise, 0) || 0
  const lacarteValue = createdRequest.lacarte_paise || 0
  const expectedTotal = itemsTotal + lacarteValue

  console.log('3️⃣  Calculation check:')
  console.log(`   - Items sum: ${itemsTotal} paise (₹${(itemsTotal / 100).toFixed(2)})`)
  console.log(`   - La-carte: ${lacarteValue} paise (₹${(lacarteValue / 100).toFixed(2)})`)
  console.log(`   - Expected total: ${expectedTotal} paise (₹${(expectedTotal / 100).toFixed(2)})`)
  console.log(
    `   - Actual total: ${createdRequest.total_paise} paise (₹${(createdRequest.total_paise / 100).toFixed(2)})`
  )
  console.log()

  if (expectedTotal === createdRequest.total_paise) {
    console.log('✅ SUCCESS: Database trigger correctly includes la-carte')
  } else if (itemsTotal === createdRequest.total_paise) {
    console.log('❌ PROBLEM CONFIRMED: Database trigger ignores la-carte')
    console.log(`   Missing: ${lacarteValue} paise (₹${(lacarteValue / 100).toFixed(2)})`)
  } else {
    console.log("⚠️  UNEXPECTED: Total doesn't match either calculation")
  }

  console.log()
  console.log('4️⃣  Cleaning up test request...')
  await supabase.from('requests').delete().eq('id', result.id)
  console.log('✅ Test request deleted')
}

testTrigger()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
