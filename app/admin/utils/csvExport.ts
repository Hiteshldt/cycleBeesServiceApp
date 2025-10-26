import { Request } from '@/lib/supabase'
import { calculateRequestTotals } from '@/lib/requestTotals'

type RequestWithTotal = Request & {
  total_items: number
  request_items?: any[]
}

export interface DownloadOptions {
  startDate: string
  endDate: string
  includeDetails: boolean
  includePricing: boolean
}

// Utility function to properly escape CSV values
export const escapeCSVValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  // If the value contains quotes, commas, newlines, or carriage returns, it needs to be quoted
  if (
    stringValue.includes('"') ||
    stringValue.includes(',') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Escape internal quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

export const generateCSV = (requests: RequestWithTotal[], options: DownloadOptions) => {
  const headers = [
    'Order ID',
    'Customer Name',
    'Phone Number',
    'Bike Model',
    'Status',
    'Created Date',
    'Confirmed Date',
    'Total Amount (INR)', // Changed from ₹ to INR for better compatibility
  ]

  if (options.includeDetails) {
    headers.push('Repair Services', 'Replacement Parts', 'Add-ons', 'Bundles')
  }

  // Start with UTF-8 BOM for Excel compatibility
  const csvRows = ['\uFEFF' + headers.map(escapeCSVValue).join(',')]

  requests.forEach((request) => {
    const formatServiceItems = (items: any[], includePricing: boolean) => {
      if (!items || items.length === 0) return ''
      return items
        .map((item) => {
          const itemName = item.label || item.name || 'Unknown Item'
          if (includePricing) {
            const price = item.price_paise ? Math.round(item.price_paise / 100) : 0
            return `${itemName} (INR ${price})` // Changed from ₹ to INR
          }
          return itemName
        })
        .join('; ') // Changed from comma to semicolon to avoid CSV conflicts
    }

    // Format dates consistently
    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      } catch {
        return ''
      }
    }

    const totals = calculateRequestTotals(request, { items: request.request_items })
    const totalAmountInr = Math.round(totals.total_paise / 100)

    const baseData = [
      escapeCSVValue(request.order_id || ''),
      escapeCSVValue(request.customer_name || ''),
      escapeCSVValue(`+${request.phone_digits_intl || ''}`),
      escapeCSVValue(request.bike_name || ''),
      escapeCSVValue(
        request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : ''
      ),
      escapeCSVValue(formatDate(request.created_at)),
      escapeCSVValue(request.sent_at ? formatDate(request.sent_at) : ''),
      escapeCSVValue(totalAmountInr.toString()),
    ]

    if (options.includeDetails) {
      const repairItems = request.request_items?.filter((item) => item.section === 'repair') || []
      const replacementItems =
        request.request_items?.filter((item) => item.section === 'replacement') || []

      // For future extensibility - addon and bundle data
      const addons: any[] = []
      const bundles: any[] = []

      baseData.push(
        escapeCSVValue(formatServiceItems(repairItems, options.includePricing)),
        escapeCSVValue(formatServiceItems(replacementItems, options.includePricing)),
        escapeCSVValue(formatServiceItems(addons, options.includePricing)),
        escapeCSVValue(formatServiceItems(bundles, options.includePricing))
      )
    }

    csvRows.push(baseData.join(','))
  })

  return csvRows.join('\n')
}

export const downloadCSVFile = (csvContent: string, startDate: string, endDate: string) => {
  // Create and download file with proper UTF-8 encoding
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    const filename = `cyclebees_requests_${startDate}_to_${endDate}.csv`
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    throw new Error('Browser does not support file download')
  }
}
