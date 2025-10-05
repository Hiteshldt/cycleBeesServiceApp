/**
 * Check Database Schema
 *
 * This script checks:
 * 1. What status values exist in the database
 * 2. Admin credentials status (hashed or plain text)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking Database Schema...\n')

  // 1. Check request statuses in the database
  console.log('📊 Checking Request Statuses:')
  const { data: requests, error: requestsError } = await supabase
    .from('requests')
    .select('status')
    .limit(100)

  if (requestsError) {
    console.error('❌ Error fetching requests:', requestsError.message)
  } else {
    const statuses = [...new Set(requests?.map(r => r.status) || [])]
    console.log(`   Found statuses: ${statuses.join(', ')}`)

    // Check if 'confirmed' status exists
    if (statuses.includes('confirmed')) {
      console.log('   ✅ "confirmed" status EXISTS in database')
    } else {
      console.log('   ⚠️  "confirmed" status NOT FOUND in database')
    }
  }

  // 2. Check admin credentials
  console.log('\n👤 Checking Admin Credentials:')
  const { data: admins, error: adminsError } = await supabase
    .from('admin_credentials')
    .select('id, username, password')

  if (adminsError) {
    console.error('❌ Error fetching admin credentials:', adminsError.message)
  } else {
    console.log(`   Found ${admins?.length || 0} admin account(s)`)

    admins?.forEach(admin => {
      const isHashed = admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$')
      console.log(`   • ${admin.username}:`)
      console.log(`     Password: ${isHashed ? '✅ HASHED (bcrypt)' : '❌ PLAIN TEXT'}`)
      console.log(`     Preview: ${admin.password.substring(0, 10)}...`)
    })
  }

  // 3. Check database schema for status column type
  console.log('\n🗄️  Database Schema Info:')
  const { data: schemaData, error: schemaError } = await supabase
    .from('requests')
    .select('*')
    .limit(1)

  if (!schemaError && schemaData && schemaData.length > 0) {
    const sampleRequest = schemaData[0]
    console.log(`   Sample request status: "${sampleRequest.status}"`)
    console.log(`   Status type: ${typeof sampleRequest.status}`)
  }

  console.log('\n✅ Database check complete!')
}

checkDatabase().catch(console.error)
