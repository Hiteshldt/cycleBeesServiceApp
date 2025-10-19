'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Activity,
} from 'lucide-react'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  confirmationRate: number
  topServices: Array<{ name: string; count: number; revenue: number }>
  ordersByStatus: Array<{ status: string; count: number; percentage: number }>
  revenueByPeriod: Array<{ period: string; revenue: number; orders: number }>
  addonsPerformance: Array<{ name: string; adoptionRate: number; revenue: number }>
  bundlesPerformance: Array<{ name: string; adoptionRate: number; revenue: number }>
  dailyTrends: Array<{ date: string; orders: number; revenue: number }>
}

interface DateRange {
  startDate: string
  endDate: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: (() => {
      // Set to September 1, 2025 to show actual data
      return '2025-09-01'
    })(),
    endDate: new Date().toISOString().split('T')[0],
  })

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      })

      const response = await fetch(`/api/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        console.error('Failed to fetch analytics data')
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        // Set empty data for graceful handling
        setAnalyticsData({
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          confirmationRate: 0,
          topServices: [],
          ordersByStatus: [],
          revenueByPeriod: [],
          addonsPerformance: [],
          bundlesPerformance: [],
          dailyTrends: [],
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate])

  const formatCurrency = (paise: number) => {
    return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
  }

  const setQuickRange = (days: number) => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <Button onClick={fetchAnalytics} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium">Date Range:</Label>
            </div>

            <div className="flex gap-2">
              <div>
                <Label htmlFor="startDate" className="text-xs text-gray-600">
                  From
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs text-gray-600">
                  To
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
                7 days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
                30 days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>
                90 days
              </Button>
            </div>

            <Button onClick={fetchAnalytics} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {analyticsData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analyticsData.totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.totalOrders.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analyticsData.averageOrderValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confirmation Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.confirmationRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Order Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.ordersByStatus.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.ordersByStatus.map((status, index) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][index] || '#6B7280',
                            }}
                          />
                          <span className="text-sm capitalize">{status.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{status.count}</p>
                          <p className="text-xs text-gray-500">{status.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No order data available</p>
                    <p className="text-xs text-gray-400">
                      Create some service requests to see status distribution
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.topServices.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.topServices.slice(0, 5).map((service) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{service.name}</p>
                          <p className="text-xs text-gray-500">{service.count} requests</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(service.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No service data available</p>
                    <p className="text-xs text-gray-400">
                      Process some service requests to see popular services
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.revenueByPeriod.length > 0 ? (
                <>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {analyticsData.revenueByPeriod.map((period) => {
                      const maxRevenue = Math.max(
                        ...analyticsData.revenueByPeriod.map((p) => p.revenue)
                      )
                      const height = maxRevenue > 0 ? (period.revenue / maxRevenue) * 200 : 0

                      return (
                        <div
                          key={period.period}
                          className="flex flex-col items-center gap-2 flex-1"
                        >
                          <div className="w-full flex flex-col items-center">
                            <div
                              className="bg-blue-500 rounded-t min-h-[4px] w-full max-w-12 transition-all duration-300 hover:bg-blue-600"
                              style={{ height: `${height}px` }}
                              title={`${period.period}: ${formatCurrency(period.revenue)} (${period.orders} orders)`}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 rotate-45 origin-center whitespace-nowrap">
                              {period.period}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>
                      {formatCurrency(
                        Math.max(...analyticsData.revenueByPeriod.map((p) => p.revenue))
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No revenue data available</p>
                    <p className="text-xs text-gray-400">
                      Complete some service orders to see revenue trends
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Add-ons Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.addonsPerformance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.addonsPerformance.map((addon) => (
                    <div key={addon.name} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2">{addon.name}</h4>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">
                          Adoption Rate:{' '}
                          <span className="font-medium">{addon.adoptionRate.toFixed(1)}%</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          Revenue:{' '}
                          <span className="font-medium">{formatCurrency(addon.revenue)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No addon data available</p>
                  <p className="text-xs text-gray-400">
                    Customers haven&apos;t selected any addons yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bundles Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Service Bundles Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.bundlesPerformance && analyticsData.bundlesPerformance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.bundlesPerformance.map((bundle) => (
                    <div
                      key={bundle.name}
                      className="bg-blue-50 rounded-lg p-4 border border-blue-100"
                    >
                      <h4 className="font-medium text-sm mb-2">{bundle.name}</h4>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">
                          Adoption Rate:{' '}
                          <span className="font-medium">{bundle.adoptionRate.toFixed(1)}%</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          Revenue:{' '}
                          <span className="font-medium">{formatCurrency(bundle.revenue)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No bundle data available</p>
                  <p className="text-xs text-gray-400">
                    Customers haven&apos;t selected any bundles yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
