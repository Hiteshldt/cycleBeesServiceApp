// Notification system for admin dashboard
export class NotificationManager {
  private audio: HTMLAudioElement | null = null
  private originalFavicon: string = '/favicon.ico'
  private notificationFavicon: string = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23ff4444"/><text x="50" y="65" text-anchor="middle" font-size="40" fill="white">!</text></svg>'
  private hasNotification: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      // Create audio element for notifications
      this.audio = new Audio('/notification-sound.mp3')
      this.audio.volume = 0.5
      
      // Store original favicon
      const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (faviconLink) {
        this.originalFavicon = faviconLink.href
      }
    }
  }

  // Play notification sound
  playNotificationSound() {
    if (this.audio) {
      this.audio.play().catch(console.warn)
    }
  }

  // Show notification indicator on favicon
  showNotificationIndicator() {
    if (this.hasNotification) return
    
    this.hasNotification = true
    this.updateFavicon(this.notificationFavicon)
    
    // Also update page title
    if (!document.title.startsWith('🔔')) {
      document.title = '🔔 ' + document.title
    }
  }

  // Clear notification indicator
  clearNotificationIndicator() {
    if (!this.hasNotification) return
    
    this.hasNotification = false
    this.updateFavicon(this.originalFavicon)
    
    // Remove notification from title
    document.title = document.title.replace('🔔 ', '')
  }

  private updateFavicon(href: string) {
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    
    if (!faviconLink) {
      faviconLink = document.createElement('link')
      faviconLink.rel = 'icon'
      document.head.appendChild(faviconLink)
    }
    
    faviconLink.href = href
  }

  // Create notification sound (fallback if file doesn't exist)
  private createNotificationSound(): string {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
    
    return ''
  }
}

// Status change detector for polling
export interface RequestStatus {
  id: string
  status: string
  updated_at?: string
}

export class StatusChangeDetector {
  private lastKnownStatuses: Map<string, string> = new Map()
  private notificationManager: NotificationManager

  constructor(notificationManager: NotificationManager) {
    this.notificationManager = notificationManager
  }

  // Check for status changes and trigger notifications
  checkForChanges(currentRequests: RequestStatus[]): boolean {
    let hasChanges = false

    for (const request of currentRequests) {
      const lastStatus = this.lastKnownStatuses.get(request.id)
      
      if (lastStatus && lastStatus !== request.status) {
        // Status changed - trigger notification
        this.notificationManager.playNotificationSound()
        this.notificationManager.showNotificationIndicator()
        hasChanges = true
      }
      
      this.lastKnownStatuses.set(request.id, request.status)
    }

    return hasChanges
  }

  // Clear all status tracking (when admin focuses on dashboard)
  clearTracking() {
    this.lastKnownStatuses.clear()
    this.notificationManager.clearNotificationIndicator()
  }

  // Initialize with current statuses (prevent false notifications on first load)
  initializeStatuses(requests: RequestStatus[]) {
    for (const request of requests) {
      this.lastKnownStatuses.set(request.id, request.status)
    }
  }
}