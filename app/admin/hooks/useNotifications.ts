import { useEffect, useRef } from 'react'
import { NotificationManager, StatusChangeDetector } from '@/lib/notification'
import { Request } from '@/lib/supabase'

type RequestWithTotal = Request & {
  total_items: number
}

export function useNotifications(notificationsEnabled: boolean, onRequestsUpdate: () => void) {
  const notificationManager = useRef<NotificationManager | null>(null)
  const statusDetector = useRef<StatusChangeDetector | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize notification system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      notificationManager.current = new NotificationManager()
      statusDetector.current = new StatusChangeDetector(notificationManager.current)
    }

    return () => {
      // Cleanup polling on unmount
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  // Start/stop polling based on notifications enabled state
  useEffect(() => {
    if (notificationsEnabled && statusDetector.current) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsEnabled])

  const startPolling = () => {
    if (pollingInterval.current) return // Already polling

    pollingInterval.current = setInterval(() => {
      if (document.hidden) return // Don't poll when tab is not visible
      fetchRequestsForNotifications()
    }, 10000) // Poll every 10 seconds
  }

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
  }

  const fetchRequestsForNotifications = async () => {
    if (!statusDetector.current) return

    try {
      // Get all requests (unpaginated) for notification checking
      const response = await fetch('/api/requests?limit=1000')
      if (response.ok) {
        const data = await response.json()
        const requests = data.requests || data
        const hasChanges = statusDetector.current.checkForChanges(
          requests.map((req: RequestWithTotal) => ({ id: req.id, status: req.status }))
        )

        // If there are changes, refresh the main requests list
        if (hasChanges) {
          onRequestsUpdate()
        }
      }
    } catch (error) {
      console.error('Error polling for updates:', error)
    }
  }

  const clearNotifications = () => {
    if (notificationManager.current) {
      notificationManager.current.clearNotificationIndicator()
    }
  }

  const initializeStatuses = (statuses: { id: string; status: string }[]) => {
    if (statusDetector.current) {
      statusDetector.current.initializeStatuses(statuses)
    }
  }

  // Clear notifications when user focuses on the dashboard
  const handleFocus = () => {
    clearNotifications()
  }

  // Add focus event listener
  useEffect(() => {
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    clearNotifications,
    initializeStatuses,
  }
}
