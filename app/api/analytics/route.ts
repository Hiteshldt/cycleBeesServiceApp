import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    // Build date filter for queries
    const dateFilter = (query: any) => {
      return query
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`)
    }

    // 1. Get total revenue and order count
    const { data: requests, error: requestsError } = await dateFilter(
      supabase.from('requests').select('total_paise, status, created_at')
    )

    if (requestsError) {
      console.error('Requests query error:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch requests data' }, { status: 500 })
    }

    const totalRevenue =
      requests?.reduce((sum: number, req: any) => sum + (req.total_paise || 0), 0) || 0
    const totalOrders = requests?.length || 0
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    // 2. Calculate confirmation rate
    const confirmedOrders = requests?.filter((req: any) => req.status === 'confirmed').length || 0
    const confirmationRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0

    // 3. Get order status distribution
    const statusCounts =
      requests?.reduce((acc: Record<string, number>, req: any) => {
        acc[req.status] = (acc[req.status] || 0) + 1
        return acc
      }, {}) || {}

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: totalOrders > 0 ? ((count as number) / totalOrders) * 100 : 0,
    }))

    // 4. Get top services from request items
    const { data: requestItems, error: itemsError } = await supabase
      .from('request_items')
      .select(
        `
        label,
        price_paise,
        section,
        request_id,
        requests!inner(created_at)
      `
      )
      .gte('requests.created_at', `${startDate}T00:00:00.000Z`)
      .lte('requests.created_at', `${endDate}T23:59:59.999Z`)

    if (itemsError) {
      console.error('Request items query error:', itemsError)
    }

    const serviceStats = (requestItems || []).reduce(
      (acc: Record<string, { count: number; revenue: number }>, item) => {
        const key = item.label
        if (!acc[key]) {
          acc[key] = { count: 0, revenue: 0 }
        }
        acc[key].count += 1
        acc[key].revenue += item.price_paise || 0
        return acc
      },
      {}
    )

    const topServices = Object.entries(serviceStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // 5. Generate revenue by period (weekly for the given range)
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const daysDiff = Math.ceil(
      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    )

    let periodFormat: 'daily' | 'weekly' | 'monthly' = 'daily'
    if (daysDiff > 60) periodFormat = 'weekly'
    if (daysDiff > 180) periodFormat = 'monthly'

    const revenueByPeriod = generatePeriodData(
      requests || [],
      periodFormat,
      startDateObj,
      endDateObj
    )

    // 6. Get addons performance with REAL data
    const { data: addons } = await supabase
      .from('addons')
      .select('id, name, price_paise')
      .eq('is_active', true)

    // Get real addon selections from confirmed orders
    const { data: confirmedAddonsList } = await supabase
      .from('confirmed_order_addons')
      .select(
        `
        addon_id,
        addons!inner (
          id,
          name,
          price_paise
        ),
        requests!inner (
          created_at,
          status
        )
      `
      )
      .gte('requests.created_at', `${startDate}T00:00:00.000Z`)
      .lte('requests.created_at', `${endDate}T23:59:59.999Z`)

    // Calculate real addon statistics
    const addonStats: Record<string, { count: number; revenue: number }> = {}

    confirmedAddonsList?.forEach((item: any) => {
      const addonId = item.addon_id
      if (!addonStats[addonId]) {
        addonStats[addonId] = {
          count: 0,
          revenue: 0,
        }
      }
      addonStats[addonId].count++
      addonStats[addonId].revenue += item.addons?.price_paise || 0
    })

    // Map to addon performance with real data
    const addonsPerformance = (addons || []).map((addon) => {
      const stats = addonStats[addon.id] || { count: 0, revenue: 0 }
      const adoptionRate = totalOrders > 0 ? (stats.count / totalOrders) * 100 : 0

      return {
        name: addon.name,
        adoptionRate,
        revenue: stats.revenue,
      }
    })

    // 7. Get bundles performance with REAL data
    const { data: bundles } = await supabase
      .from('service_bundles')
      .select('id, name, price_paise')
      .eq('is_active', true)

    // Get real bundle selections from confirmed orders
    const { data: confirmedBundlesList } = await supabase
      .from('confirmed_order_bundles')
      .select(
        `
        bundle_id,
        service_bundles!inner (
          id,
          name,
          price_paise
        ),
        requests!inner (
          created_at,
          status
        )
      `
      )
      .gte('requests.created_at', `${startDate}T00:00:00.000Z`)
      .lte('requests.created_at', `${endDate}T23:59:59.999Z`)

    // Calculate real bundle statistics
    const bundleStats: Record<string, { count: number; revenue: number }> = {}

    confirmedBundlesList?.forEach((item: any) => {
      const bundleId = item.bundle_id
      if (!bundleStats[bundleId]) {
        bundleStats[bundleId] = {
          count: 0,
          revenue: 0,
        }
      }
      bundleStats[bundleId].count++
      bundleStats[bundleId].revenue += item.service_bundles?.price_paise || 0
    })

    // Map to bundle performance with real data
    const bundlesPerformance = (bundles || []).map((bundle) => {
      const stats = bundleStats[bundle.id] || { count: 0, revenue: 0 }
      const adoptionRate = totalOrders > 0 ? (stats.count / totalOrders) * 100 : 0

      return {
        name: bundle.name,
        adoptionRate,
        revenue: stats.revenue,
      }
    })

    // 8. Generate daily trends for limited range (max 90 days)
    const trendsEndDate = new Date(endDateObj)
    const trendsStartDate = new Date(
      Math.max(
        startDateObj.getTime(),
        endDateObj.getTime() - 90 * 24 * 60 * 60 * 1000 // Max 90 days
      )
    )
    const dailyTrends = generateDailyTrends(requests || [], trendsStartDate, trendsEndDate)

    const analyticsData = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      confirmationRate,
      topServices,
      ordersByStatus,
      revenueByPeriod,
      addonsPerformance,
      bundlesPerformance,
      dailyTrends,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generatePeriodData(
  requests: any[],
  periodFormat: 'daily' | 'weekly' | 'monthly',
  _startDate: Date,
  _endDate: Date
) {
  const periods: Record<string, { revenue: number; orders: number }> = {}

  requests.forEach((request) => {
    const requestDate = new Date(request.created_at)
    let periodKey: string

    if (periodFormat === 'daily') {
      periodKey = requestDate.toISOString().split('T')[0]
    } else if (periodFormat === 'weekly') {
      const weekStart = new Date(requestDate)
      weekStart.setDate(requestDate.getDate() - requestDate.getDay())
      periodKey = `Week of ${weekStart.toISOString().split('T')[0]}`
    } else {
      periodKey = `${requestDate.getFullYear()}-${(requestDate.getMonth() + 1).toString().padStart(2, '0')}`
    }

    if (!periods[periodKey]) {
      periods[periodKey] = { revenue: 0, orders: 0 }
    }

    periods[periodKey].revenue += request.total_paise || 0
    periods[periodKey].orders += 1
  })

  return Object.entries(periods)
    .map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orders: data.orders,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

function generateDailyTrends(requests: any[], startDate: Date, endDate: Date) {
  const dailyData: Record<string, { orders: number; revenue: number }> = {}

  // Initialize all days in range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyData[dateKey] = { orders: 0, revenue: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Fill with actual data
  requests.forEach((request) => {
    const dateKey = new Date(request.created_at).toISOString().split('T')[0]
    if (dailyData[dateKey]) {
      dailyData[dateKey].orders += 1
      dailyData[dateKey].revenue += request.total_paise || 0
    }
  })

  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: data.revenue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
