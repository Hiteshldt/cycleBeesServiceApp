/**
 * Migration Script: Hash Plain Text Passwords
 *
 * This script converts existing plain text passwords in the admin_credentials table
 * to bcrypt hashed passwords.
 *
 * WARNING: This is a one-time migration. Run this only once!
 *
 * Usage: npx tsx scripts/hash-passwords.ts
 */

import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '../../lib/auth'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migratePasswords() {
  console.log('🔐 Starting password migration...\n')

  try {
    // Fetch all admin credentials
    const { data: admins, error } = await supabase
      .from('admin_credentials')
      .select('id, username, password')

    if (error) {
      throw error
    }

    if (!admins || admins.length === 0) {
      console.log('❌ No admin credentials found!')
      return
    }

    console.log(`📋 Found ${admins.length} admin account(s) to migrate\n`)

    // Hash each password and update
    for (const admin of admins) {
      console.log(`Processing: ${admin.username}...`)

      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (admin.password.startsWith('$2b$')) {
        console.log(`  ⏭️  Already hashed, skipping\n`)
        continue
      }

      // Hash the plain text password
      const hashedPassword = await hashPassword(admin.password)

      // Update in database
      const { error: updateError } = await supabase
        .from('admin_credentials')
        .update({ password: hashedPassword })
        .eq('id', admin.id)

      if (updateError) {
        console.error(`  ❌ Error updating ${admin.username}:`, updateError)
        continue
      }

      console.log(`  ✅ Successfully hashed password\n`)
    }

    console.log('✨ Password migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migratePasswords()
