/**
 * Analyze request_notes table - check if it exists and is being used
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeRequestNotes() {
  console.log('🔍 Analyzing request_notes Table\n')
  console.log('='.repeat(70))

  // Check if table exists and has data
  const { data: notes, error } = await supabase.from('request_notes').select('*').limit(10)

  if (error) {
    if (error.code === '42P01') {
      console.log('\n❌ TABLE DOES NOT EXIST')
      console.log('   Error: relation "request_notes" does not exist')
      console.log()
      console.log('✅ RECOMMENDATION: Safe to remove API endpoints')
      console.log('   The table was never created in the database.')
      console.log()
      return
    } else {
      console.error('\n❌ Error querying table:', error.message)
      console.error('   Code:', error.code)
      return
    }
  }

  console.log('\n✅ TABLE EXISTS')
  console.log(`   Total notes found: ${notes?.length || 0}`)
  console.log()

  if (notes && notes.length > 0) {
    console.log('📝 Sample Notes:')
    notes.forEach((note: any, idx) => {
      console.log(`   ${idx + 1}. Request: ${note.request_id}`)
      console.log(`      Text: ${note.note_text?.substring(0, 50)}...`)
      console.log(`      Created: ${note.created_at}`)
      console.log()
    })

    console.log('⚠️  WARNING: Table has data!')
    console.log('   NOT safe to remove without data migration.')
  } else {
    console.log('✅ TABLE IS EMPTY')
    console.log('   Safe to remove if not needed.')
  }

  console.log()
  console.log('='.repeat(70))
  console.log('\n📋 FINDINGS:\n')
  console.log('1. API endpoints exist:')
  console.log('   - GET    /api/requests/[id]/notes')
  console.log('   - POST   /api/requests/[id]/notes')
  console.log('   - PUT    /api/requests/[id]/notes/[noteId]')
  console.log('   - DELETE /api/requests/[id]/notes/[noteId]')
  console.log()
  console.log('2. Admin UI usage: NOT FOUND')
  console.log('   - No UI components use the notes feature')
  console.log("   - Admin dashboard doesn't show notes")
  console.log()
  console.log('3. Documentation mentions:')
  console.log('   - DATABASE.md marks it as "Missing"')
  console.log('   - PROJECT_TRACKER.md lists it as missing')
  console.log()

  if (!notes || notes.length === 0) {
    console.log('🎯 RECOMMENDATION:')
    console.log('   ✅ SAFE TO REMOVE')
    console.log('   - Table exists but is empty')
    console.log('   - No UI uses it')
    console.log('   - API endpoints are orphaned')
    console.log()
    console.log('   Actions:')
    console.log('   1. Delete API route files')
    console.log('   2. Drop table from database (optional)')
    console.log('   3. Update documentation')
  } else {
    console.log('🎯 RECOMMENDATION:')
    console.log('   ⚠️  REVIEW DATA FIRST')
    console.log('   - Table has existing notes')
    console.log('   - Export/backup before removing')
    console.log('   - Or build UI to use the feature')
  }

  console.log('\n' + '='.repeat(70))
}

analyzeRequestNotes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
