'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Settings, Search } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Image
                src="/logo.png"
                alt="CycleBees Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
              <h1 className="text-3xl font-bold text-gray-900">CycleBees</h1>
            </div>
            <p className="text-gray-600 mt-2">Professional Bike Service Management</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Access */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Find Your Service Request</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter Order ID and phone to view details, select add-ons, and track status.
            </p>
            <Link href="/lookup">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Look Up My Order
              </Button>
            </Link>
          </div>

          {/* Admin Access */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Admin Dashboard</h2>
            <p className="text-sm text-gray-600 mb-4">
              Access admin panel to create requests, manage orders, and download PDFs.
            </p>
            <Link href="/admin">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Settings className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Need help? Contact us on WhatsApp or email for assistance.</p>
        </div>
      </div>
    </div>
  )
}