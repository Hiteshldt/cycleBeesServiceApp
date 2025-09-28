import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency utilities for INR (in paise)
export function formatCurrency(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)
}

// Convert rupees to paise (avoid floating point issues)
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

// Convert paise to rupees
export function paiseToRupees(paise: number): number {
  return paise / 100
}

// Validate phone number (international format without +)
export function isValidPhoneNumber(phone: string): boolean {
  // Should be 10-15 digits, no spaces, no + prefix
  return /^\d{10,15}$/.test(phone)
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  if (phone.startsWith('91') && phone.length === 12) {
    // Indian number
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`
  }
  return `+${phone}`
}

// Generate WhatsApp click-to-chat URL
export function normalizeIntlPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

export function generateWhatsAppURL(phone: string, message: string): string {
  const normalized = normalizeIntlPhone(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encodedMessage}`
}

export function openWhatsApp(phone: string, message: string) {
  const webUrl = generateWhatsAppURL(phone, message)
  window.open(webUrl, '_blank')
}

// Generate WhatsApp message template
export function generateWhatsAppMessage(
  customerName: string,
  bikeName: string,
  orderId: string,
  orderUrl: string
): string {
  const firstName = customerName.split(' ')[0]
  
  return ` *CycleBees* - Professional Bike Service

Hello *${firstName}*! 

Your service estimate is ready for:
*Bike:* ${bikeName}
*Order ID:* ${orderId}

*Next Steps:*
1. Click the link below to view your estimate
2. Select your preferred services & add-ons
3. Confirm your order for doorstep service

*View Your Estimate:* ${orderUrl}

*Need Help?*
Our support team is here to assist you!

*Visit us:* www.cyclebees.in
For premium doorstep cycle repair services

*CycleBees* - Your bike, our care! `
}

// Format date for display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Status badge colors
export function getStatusColor(status: string): string {
  switch (status) {
    case 'sent':
      return 'bg-blue-100 text-blue-800'
    case 'viewed':
      return 'bg-green-100 text-green-800'
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}


// Generate unique order ID
export function generateOrderID(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2) // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  return `CB${year}${month}${day}${hours}${minutes}${random}`
}
