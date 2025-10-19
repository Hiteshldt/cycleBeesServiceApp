/**
 * Apply the la-carte fix migration to production database
 * Run with: npx tsx scripts/apply-lacarte-fix.ts
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🔧 Applying La-Carte Fix Migration\n')
  console.log('='.repeat(70))

  // Read the migration file
  const migrationPath = path.join(
    process.cwd(),
    'db',
    'migrations',
    '002_fix_lacarte_in_totals.sql'
  )
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('\n📋 Migration Preview:')
  console.log('   File:', migrationPath)
  console.log('   Size:', migrationSQL.length, 'bytes')
  console.log()

  // Show what will be fixed
  console.log('1️⃣  Checking current state...')
  const { data: beforeRequests, error: beforeError } = await supabase
    .from('requests')
    .select('id, order_id, status, subtotal_paise, lacarte_paise, total_paise')
    .not('lacarte_paise', 'is', null)
    .gt('lacarte_paise', 0)
    .order('created_at', { ascending: false })
    .limit(10)

  if (beforeError) {
    console.error('❌ Error:', beforeError)
    return
  }

  let needsFixCount = 0
  console.log('\n   Current requests with la-carte:')
  beforeRequests?.forEach((req: any) => {
    const expected = req.subtotal_paise + req.lacarte_paise
    const needsFix = req.total_paise !== expected
    if (needsFix) needsFixCount++

    console.log(`   ${req.order_id} (${req.status})`)
    console.log(`     Subtotal: ₹${(req.subtotal_paise / 100).toFixed(2)}`)
    console.log(`     La-carte: ₹${(req.lacarte_paise / 100).toFixed(2)}`)
    console.log(`     Current total: ₹${(req.total_paise / 100).toFixed(2)}`)
    console.log(
      `     Expected: ₹${(expected / 100).toFixed(2)} ${needsFix ? '❌ NEEDS FIX' : '✅ OK'}`
    )
    console.log()
  })

  console.log(`   Summary: ${needsFixCount} requests need fixing`)
  console.log()

  // Ask for confirmation
  console.log('⚠️  WARNING: This will modify the database!')
  console.log('   - Update trigger function to include la-carte')
  console.log('   - Backfill incorrect totals for pending/sent requests')
  console.log()

  // Note: In a real scenario, you'd want user confirmation here
  // For now, we'll proceed automatically in development

  console.log('2️⃣  Applying migration...')

  try {
    // We can't execute raw SQL with anon key, so we'll do it via RPC if available
    // Or manually copy the SQL and run in Supabase dashboard
    console.log('\n⚠️  MANUAL STEP REQUIRED:')
    console.log('   The anon key cannot execute SQL migrations directly.')
    console.log('   Please follow these steps:')
    console.log()
    console.log('   1. Go to Supabase Dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy and execute the SQL from:')
    console.log(`      ${migrationPath}`)
    console.log()
    console.log('   Or run this in your Supabase SQL Editor:\n')

    // Split SQL into statements and display them
    console.log('   ─'.repeat(70))
    console.log(migrationSQL)
    console.log('   ─'.repeat(70))
  } catch (err) {
    console.error('❌ Error applying migration:', err)
    return
  }

  console.log('\n3️⃣  After applying the SQL, run test to verify:')
  console.log('   npx tsx scripts/test-trigger.ts')
  console.log()
  console.log('='.repeat(70))
}

applyMigration()
  .then(() => {
    console.log('✅ Migration preparation complete')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
