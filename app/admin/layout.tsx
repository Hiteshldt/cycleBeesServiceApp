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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="CycleBees Logo"
                width={36}
                height={36}
                className="object-contain mr-3"
                priority
              />
              <h1 className="text-2xl font-bold text-gray-900">CycleBees</h1>
              <span className="ml-2 text-sm text-gray-500">Admin Dashboard</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Requests
              </Link>
              <Link
                href="/admin/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                New Request
              </Link>
              <Link
                href="/admin/settings"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Settings
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  )
}