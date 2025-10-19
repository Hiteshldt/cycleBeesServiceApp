import React from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Download } from 'lucide-react'

interface AdminHeaderProps {
  notificationsEnabled: boolean
  loadingNewRequest: boolean
  onToggleNotifications: () => void
  onDownload: () => void
  onNewRequest: () => void
}

export function AdminHeader({
  notificationsEnabled,
  loadingNewRequest,
  onToggleNotifications,
  onDownload,
  onNewRequest,
}: AdminHeaderProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Service Requests
          </h1>
          <p className="text-gray-600 flex items-center gap-1 text-xs">
            <span>📋</span>
            Manage all customer service requests
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onToggleNotifications}
            variant={notificationsEnabled ? 'default' : 'outline'}
            size="sm"
            className={`transition-all duration-200 h-8 px-3 text-xs ${
              notificationsEnabled
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? (
              <>
                <Bell className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Notifications On</span>
                <span className="sm:hidden">🔔 On</span>
              </>
            ) : (
              <>
                <BellOff className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Notifications Off</span>
                <span className="sm:hidden">🔕 Off</span>
              </>
            )}
          </Button>
          <Button
            onClick={onDownload}
            variant="outline"
            size="sm"
            className="transition-all duration-200 h-8 px-3 text-xs border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-700"
            title="Download requests as CSV"
          >
            <Download className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Download CSV</span>
            <span className="sm:hidden">📥</span>
          </Button>
          <Button
            onClick={onNewRequest}
            disabled={loadingNewRequest}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto h-8 px-3 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingNewRequest ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 mr-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-blue-200 absolute top-0 left-0"></div>
                </div>
                <span className="hidden sm:inline">Loading...</span>
                <span className="sm:hidden">⏳</span>
              </>
            ) : (
              <>
                <span className="mr-1">+</span>
                <span className="hidden sm:inline">Create New Request</span>
                <span className="sm:hidden">New Request</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
