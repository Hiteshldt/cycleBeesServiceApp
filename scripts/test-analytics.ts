/**
 * Test analytics calculations and identify issues
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAnalytics() {
  console.log('🔍 Testing Analytics Page Issues\n')
  console.log('='.repeat(70))

  const startDate = '2025-09-01'
  const endDate = new Date().toISOString().split('T')[0]

  console.log(`\nDate Range: ${startDate} to ${endDate}\n`)

  // 1. Fetch requests
  const { data: requests, error } = await supabase
    .from('requests')
    .select('*')
    .gte('created_at', `${startDate}T00:00:00.000Z`)
    .lte('created_at', `${endDate}T23:59:59.999Z`)

  if (error) {
    console.error('❌ Error fetching requests:', error)
    return
  }

  console.log(`📊 Found ${requests?.length || 0} requests\n`)

  // 2. Check total revenue calculation
  const totalRevenue = requests?.reduce((sum, req) => sum + (req.total_paise || 0), 0) || 0
  const totalOrders = requests?.length || 0
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  console.log('💰 Revenue Calculations:')
  console.log(`   Total Revenue: ₹${(totalRevenue / 100).toFixed(2)} (${totalRevenue} paise)`)
  console.log(`   Total Orders: ${totalOrders}`)
  console.log(`   Avg Order Value: ₹${(avgOrderValue / 100).toFixed(2)} (${avgOrderValue} paise)`)
  console.log()

  // 3. Check if totals include la-carte
  let missingLaCarte = 0
  console.log('🔍 Checking individual requests for la-carte inclusion:')
  requests?.forEach((req, idx) => {
    if (req.lacarte_paise && req.lacarte_paise > 0) {
      const expectedMin = req.subtotal_paise + req.lacarte_paise
      const hasProblem = req.total_paise < expectedMin

      if (hasProblem && idx < 5) {
        console.log(`   ${req.order_id} (${req.status}):`)
        console.log(`     Subtotal: ${req.subtotal_paise}, La-carte: ${req.lacarte_paise}`)
        console.log(`     Expected (min): ${expectedMin}, Actual: ${req.total_paise}`)
        console.log(`     ❌ MISSING LA-CARTE IN TOTAL`)
        missingLaCarte++
      } else if (hasProblem) {
        missingLaCarte++
      }
    }
  })

  if (missingLaCarte > 0) {
    console.log(`\n   ⚠️  ${missingLaCarte} requests have missing la-carte in total_paise`)
    console.log(`   💡 This affects revenue calculations!`)
  } else {
    console.log(`   ✅ All requests include la-carte correctly`)
  }
  console.log()

  // 4. Status distribution
  const statusCounts: Record<string, number> = {}
  requests?.forEach((req) => {
    statusCounts[req.status] = (statusCounts[req.status] || 0) + 1
  })

  console.log('📈 Status Distribution:')
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = ((count / totalOrders) * 100).toFixed(1)
    console.log(`   ${status}: ${count} (${percentage}%)`)
  })
  console.log()

  // 5. Confirmed orders check
  const confirmedOrders = requests?.filter((req) => req.status === 'confirmed') || []
  const confirmationRate = totalOrders > 0 ? (confirmedOrders.length / totalOrders) * 100 : 0

  console.log('✅ Confirmation Rate:')
  console.log(`   Confirmed: ${confirmedOrders.length}`)
  console.log(`   Total: ${totalOrders}`)
  console.log(`   Rate: ${confirmationRate.toFixed(1)}%`)
  console.log()

  // 6. Check addon performance data
  const { data: addons } = await supabase.from('addons').select('*').eq('is_active', true)

  console.log('🎁 Addons in Database:')
  console.log(`   Total Active Addons: ${addons?.length || 0}`)

  // Check if addon performance is using real data
  const { data: confirmedAddons } = await supabase.from('confirmed_order_addons').select('addon_id')

  console.log(`   Confirmed Addon Selections: ${confirmedAddons?.length || 0}`)

  if ((addons?.length || 0) > 0 && (confirmedAddons?.length || 0) === 0) {
    console.log(`   ⚠️  Addon performance shows MOCK DATA (no real selections yet)`)
  } else {
    console.log(`   ✅ Real addon data available`)
  }
  console.log()

  // 7. Check top services calculation
  const { data: requestItems } = await supabase
    .from('request_items')
    .select(
      `
      label,
      price_paise,
      request_id,
      requests!inner(created_at)
    `
    )
    .gte('requests.created_at', `${startDate}T00:00:00.000Z`)
    .lte('requests.created_at', `${endDate}T23:59:59.999Z`)

  console.log('🔧 Service Items Analysis:')
  console.log(`   Total Service Items: ${requestItems?.length || 0}`)

  if (requestItems && requestItems.length > 0) {
    const serviceStats: Record<string, { count: number; revenue: number }> = {}
    requestItems.forEach((item) => {
      if (!serviceStats[item.label]) {
        serviceStats[item.label] = { count: 0, revenue: 0 }
      }
      serviceStats[item.label].count++
      serviceStats[item.label].revenue += item.price_paise || 0
    })

    const topServices = Object.entries(serviceStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    console.log(`   Top 5 Services by Revenue:`)
    topServices.forEach((service, idx) => {
      console.log(
        `     ${idx + 1}. ${service.name}: ₹${(service.revenue / 100).toFixed(2)} (${service.count} times)`
      )
    })
  } else {
    console.log(`   ⚠️  No service items found`)
  }
  console.log()

  // 8. Revenue trend check
  console.log('📊 Revenue Distribution Check:')
  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  let periodFormat = 'daily'
  if (daysDiff > 60) periodFormat = 'weekly'
  if (daysDiff > 180) periodFormat = 'monthly'

  console.log(`   Date range: ${daysDiff} days`)
  console.log(`   Period format: ${periodFormat}`)
  console.log()

  console.log('='.repeat(70))
  console.log('\n🎯 ISSUES SUMMARY:\n')

  const issues = []
  if (missingLaCarte > 0) {
    issues.push(`❌ ${missingLaCarte} requests missing la-carte in total (affects revenue)`)
  }
  if ((addons?.length || 0) > 0 && (confirmedAddons?.length || 0) === 0) {
    issues.push(`⚠️  Addon performance shows mock data (not real)`)
  }
  if ((requestItems?.length || 0) === 0) {
    issues.push(`⚠️  No service items found`)
  }
  if (totalOrders === 0) {
    issues.push(`⚠️  No requests in date range`)
  }

  if (issues.length === 0) {
    console.log('✅ No issues found! Analytics looks good.')
  } else {
    issues.forEach((issue) => console.log(issue))
  }

  console.log('\n' + '='.repeat(70))
}

testAnalytics()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
