/**
 * Pull complete database schema and data for reference
 * Creates a comprehensive backup/reference document
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function backupDatabaseSchema() {
  console.log('📦 Creating Database Schema Backup\n')
  console.log('='.repeat(70))

  let output = `# CycleBees Database Schema Backup
**Generated**: ${new Date().toISOString()}
**Database**: ${supabaseUrl}

---

## Table of Contents
1. [Tables Overview](#tables-overview)
2. [Table Details](#table-details)
3. [Data Samples](#data-samples)

---

## Tables Overview

`

  const tables = [
    'requests',
    'request_items',
    'request_notes',
    'confirmed_order_services',
    'confirmed_order_addons',
    'confirmed_order_bundles',
    'addons',
    'service_bundles',
    'lacarte_settings',
    'admin_credentials',
  ]

  console.log('\n📊 Fetching table information...\n')

  const tableInfo: Record<string, any> = {}

  for (const table of tables) {
    console.log(`   Checking ${table}...`)
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: false })
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        tableInfo[table] = { exists: false, error: 'Table does not exist' }
      } else {
        tableInfo[table] = { exists: false, error: error.message }
      }
    } else {
      tableInfo[table] = {
        exists: true,
        rowCount: count || 0,
        sample: data?.[0] || null,
      }
    }
  }

  // Generate overview
  output += '| Table | Exists | Row Count | Status |\n'
  output += '|-------|--------|-----------|--------|\n'

  for (const [table, info] of Object.entries(tableInfo)) {
    const exists = info.exists ? '✅' : '❌'
    const count = info.exists ? info.rowCount : 'N/A'
    const status = info.exists ? (info.rowCount > 0 ? 'Has data' : 'Empty') : 'Missing'
    output += `| \`${table}\` | ${exists} | ${count} | ${status} |\n`
  }

  output += '\n---\n\n## Table Details\n\n'

  for (const [table, info] of Object.entries(tableInfo)) {
    output += `### ${table}\n\n`

    if (!info.exists) {
      output += `**Status**: ❌ Table does not exist\n`
      output += `**Error**: ${info.error}\n\n`
      continue
    }

    output += `**Status**: ✅ Exists\n`
    output += `**Row Count**: ${info.rowCount}\n\n`

    if (info.sample) {
      output += '**Schema** (from sample row):\n\n'
      output += '| Column | Type | Sample Value |\n'
      output += '|--------|------|-------------|\n'

      for (const [key, value] of Object.entries(info.sample)) {
        const type = typeof value
        const sampleValue =
          value === null
            ? 'null'
            : type === 'string' && (value as string).length > 50
              ? `"${(value as string).substring(0, 47)}..."`
              : JSON.stringify(value)
        output += `| \`${key}\` | ${type} | ${sampleValue} |\n`
      }
      output += '\n'
    } else {
      output += '**Schema**: No sample data available (table is empty)\n\n'
    }
  }

  output += '\n---\n\n## Data Samples\n\n'

  // Get more detailed samples for important tables
  const importantTables = [
    'requests',
    'request_items',
    'addons',
    'service_bundles',
    'lacarte_settings',
  ]

  for (const table of importantTables) {
    if (!tableInfo[table]?.exists || tableInfo[table].rowCount === 0) continue

    output += `### ${table} Sample Data\n\n`

    const { data } = await supabase.from(table).select('*').limit(3)

    if (data && data.length > 0) {
      output += '```json\n'
      output += JSON.stringify(data, null, 2)
      output += '\n```\n\n'
    }
  }

  output += '\n---\n\n## Relationships\n\n'
  output += `
### requests → request_items
- \`request_items.request_id\` → \`requests.id\`
- **Cascade**: ON DELETE CASCADE

### requests → confirmed_order_services
- \`confirmed_order_services.request_id\` → \`requests.id\`
- **Cascade**: ON DELETE CASCADE

### requests → confirmed_order_addons
- \`confirmed_order_addons.request_id\` → \`requests.id\`
- **Cascade**: ON DELETE CASCADE

### requests → confirmed_order_bundles
- \`confirmed_order_bundles.request_id\` → \`requests.id\`
- **Cascade**: ON DELETE CASCADE

### requests → request_notes (if exists)
- \`request_notes.request_id\` → \`requests.id\`
- **Cascade**: ON DELETE CASCADE

### confirmed_order_services → request_items
- \`confirmed_order_services.service_item_id\` → \`request_items.id\`
- **Cascade**: ON DELETE CASCADE

### confirmed_order_addons → addons
- \`confirmed_order_addons.addon_id\` → \`addons.id\`
- **Cascade**: ON DELETE CASCADE

### confirmed_order_bundles → service_bundles
- \`confirmed_order_bundles.bundle_id\` → \`service_bundles.id\`
- **Cascade**: ON DELETE CASCADE
`

  output += '\n---\n\n## Notes\n\n'
  output += '- All prices stored in **paise** (1 rupee = 100 paise)\n'
  output += '- Timestamps use **TIMESTAMP WITH TIME ZONE**\n'
  output += '- UUIDs generated via **uuid_generate_v4()**\n'
  output += '- Database trigger `update_request_totals()` auto-calculates totals\n'
  output += '- Short slugs generated via `generate_short_slug()` function\n'

  output += '\n---\n\n**Backup Complete**: ' + new Date().toISOString() + '\n'

  // Write to file
  const outputPath = path.join(process.cwd(), 'docs', 'database', 'SCHEMA_BACKUP.md')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, output)

  console.log('\n✅ Backup created successfully!')
  console.log(`   File: ${outputPath}`)
  console.log('\n' + '='.repeat(70))
}

backupDatabaseSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
