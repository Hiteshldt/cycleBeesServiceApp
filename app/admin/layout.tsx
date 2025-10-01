'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingNewRequest, setLoadingNewRequest] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setIsLoading(false)
      return
    }

    // Check authentication status with a small delay to ensure sessionStorage is available
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem('adminAuth')
      console.log('Checking auth status:', authStatus)
      if (authStatus === 'authenticated') {
        setIsAuthenticated(true)
        setIsLoading(false)
      } else {
        console.log('Not authenticated, redirecting to login')
        router.push('/admin/login')
        setIsLoading(false)
      }
    }

    // Small delay to ensure sessionStorage is ready
    setTimeout(checkAuth, 100)
  }, [pathname, router])

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    document.cookie = 'adminAuth=; path=/; max-age=0'
    router.push('/admin/login')
  }

  const handleNewRequestClick = () => {
    setLoadingNewRequest(true)
    router.push('/admin/new')
  }

  const handleSettingsClick = () => {
    setLoadingSettings(true)
    router.push('/admin/settings')
  }

  const handleAnalyticsClick = () => {
    setLoadingAnalytics(true)
    router.push('/admin/analytics')
  }

  // Reset loading states when pathname changes
  useEffect(() => {
    setLoadingNewRequest(false)
    setLoadingSettings(false)
    setLoadingAnalytics(false)
  }, [pathname])

  // Show enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 border-r-indigo-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-lg font-medium text-gray-800 animate-pulse">Loading Dashboard...</p>
            <p className="text-sm text-gray-600">🚴‍♂️ Preparing your admin workspace</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login page content if on login route
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-4">
            {/* Enhanced Logo Section */}
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl">
                  <Image
                    src="/logo.png"
                    alt="CycleBees Logo"
                    width={32}
                    height={32}
                    className="object-contain filter brightness-0 invert"
                    priority
                  />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  CycleBees
                </h1>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Admin Dashboard
                </span>
              </div>
            </div>

            {/* Enhanced Navigation with Responsive Design */}
            <nav className="flex items-center space-x-2">
              <Link
                href="/admin"
                className="group relative text-gray-600 hover:text-blue-600 px-2 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50"
              >
                <span className="relative z-10 hidden sm:inline">Requests</span>
                <span className="relative z-10 sm:hidden">📋</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </Link>
              <button
                onClick={handleNewRequestClick}
                disabled={loadingNewRequest}
                className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-2 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loadingNewRequest ? (
                  <>
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-blue-200 absolute top-0 left-0"></div>
                      </div>
                      <span className="hidden sm:inline">Loading...</span>
                      <span className="sm:hidden">⏳</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="relative z-10 hidden sm:inline">+ New Request</span>
                    <span className="relative z-10 sm:hidden">➕</span>
                  </>
                )}
                <div className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>
              <button
                onClick={handleAnalyticsClick}
                disabled={loadingAnalytics}
                className="group relative text-gray-600 hover:text-purple-600 px-2 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-purple-50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loadingAnalytics ? (
                  <>
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-purple-600 border-r-purple-500 absolute top-0 left-0"></div>
                      </div>
                      <span className="hidden sm:inline">Loading...</span>
                      <span className="sm:hidden">⏳</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="relative z-10 hidden sm:inline">Analytics</span>
                    <span className="relative z-10 sm:hidden">📊</span>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>
              <button
                onClick={handleSettingsClick}
                disabled={loadingSettings}
                className="group relative text-gray-600 hover:text-blue-600 px-2 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loadingSettings ? (
                  <>
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-blue-600 border-r-indigo-500 absolute top-0 left-0"></div>
                      </div>
                      <span className="hidden sm:inline">Loading...</span>
                      <span className="sm:hidden">⏳</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="relative z-10 hidden sm:inline">Settings</span>
                    <span className="relative z-10 sm:hidden">⚙️</span>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2 hidden sm:block"></div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="group relative border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-300 px-2 sm:px-4 py-2.5 rounded-xl transition-all duration-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 sm:mr-2 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Optimized Main Content */}
      <main className="max-w-7xl mx-auto py-4 px-2 sm:px-4 lg:px-6">
        {children}
      </main>
    </div>
  )
}