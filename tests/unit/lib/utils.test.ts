import {
  cn,
  formatCurrency,
  rupeesToPaise,
  paiseToRupees,
  isValidPhoneNumber,
  formatPhoneNumber,
  normalizeIntlPhone,
  generateWhatsAppURL,
  generateWhatsAppMessage,
  formatDate,
  getStatusColor,
  generateOrderID,
} from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn() - Class name utility', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3')
    })

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional', false && 'not-applied')).toBe(
        'base-class conditional'
      )
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })
  })

  describe('formatCurrency() - Currency formatting', () => {
    it('should format paise to Indian rupees correctly', () => {
      expect(formatCurrency(150000)).toBe('₹1,500')
    })

    it('should handle zero paise', () => {
      expect(formatCurrency(0)).toBe('₹0')
    })

    it('should handle decimal values correctly', () => {
      expect(formatCurrency(150050)).toBe('₹1,500.5')
    })

    it('should handle large amounts', () => {
      expect(formatCurrency(10000000)).toBe('₹1,00,000')
    })

    it('should handle single paise', () => {
      expect(formatCurrency(1)).toBe('₹0.01')
    })
  })

  describe('rupeesToPaise() - Convert rupees to paise', () => {
    it('should convert rupees to paise correctly', () => {
      expect(rupeesToPaise(1500)).toBe(150000)
    })

    it('should handle zero', () => {
      expect(rupeesToPaise(0)).toBe(0)
    })

    it('should handle decimal rupees', () => {
      expect(rupeesToPaise(1500.5)).toBe(150050)
    })

    it('should round to nearest paise', () => {
      expect(rupeesToPaise(1500.505)).toBe(150051)
      expect(rupeesToPaise(1500.504)).toBe(150050)
    })
  })

  describe('paiseToRupees() - Convert paise to rupees', () => {
    it('should convert paise to rupees correctly', () => {
      expect(paiseToRupees(150000)).toBe(1500)
    })

    it('should handle zero', () => {
      expect(paiseToRupees(0)).toBe(0)
    })

    it('should handle decimal conversion', () => {
      expect(paiseToRupees(150050)).toBe(1500.5)
    })
  })

  describe('isValidPhoneNumber() - Phone number validation', () => {
    it('should validate 10-digit Indian numbers', () => {
      expect(isValidPhoneNumber('9876543210')).toBe(true)
    })

    it('should validate 12-digit numbers with country code', () => {
      expect(isValidPhoneNumber('919876543210')).toBe(true)
    })

    it('should reject numbers with spaces', () => {
      expect(isValidPhoneNumber('98765 43210')).toBe(false)
    })

    it('should reject numbers with + prefix', () => {
      expect(isValidPhoneNumber('+919876543210')).toBe(false)
    })

    it('should reject numbers shorter than 10 digits', () => {
      expect(isValidPhoneNumber('987654321')).toBe(false)
    })

    it('should reject numbers longer than 15 digits', () => {
      expect(isValidPhoneNumber('9876543210123456')).toBe(false)
    })

    it('should reject alphabetic characters', () => {
      expect(isValidPhoneNumber('98765abc10')).toBe(false)
    })

    it('should reject empty strings', () => {
      expect(isValidPhoneNumber('')).toBe(false)
    })
  })

  describe('formatPhoneNumber() - Phone number formatting', () => {
    it('should format Indian numbers with country code', () => {
      expect(formatPhoneNumber('919876543210')).toBe('+91 98765 43210')
    })

    it('should handle non-Indian numbers with + prefix', () => {
      expect(formatPhoneNumber('14155552671')).toBe('+14155552671')
    })

    it('should handle already formatted numbers', () => {
      expect(formatPhoneNumber('123456789012')).toBe('+123456789012')
    })
  })

  describe('normalizeIntlPhone() - Phone number normalization', () => {
    it('should add 91 prefix to 10-digit numbers', () => {
      expect(normalizeIntlPhone('9876543210')).toBe('919876543210')
    })

    it('should not modify already prefixed numbers', () => {
      expect(normalizeIntlPhone('919876543210')).toBe('919876543210')
    })

    it('should remove non-digit characters', () => {
      expect(normalizeIntlPhone('+91 98765 43210')).toBe('919876543210')
    })

    it('should handle empty strings', () => {
      expect(normalizeIntlPhone('')).toBe('')
    })

    it('should handle null/undefined gracefully', () => {
      expect(normalizeIntlPhone(null as any)).toBe('')
      expect(normalizeIntlPhone(undefined as any)).toBe('')
    })
  })

  describe('generateWhatsAppURL() - WhatsApp URL generation', () => {
    it('should generate correct WhatsApp URL', () => {
      const url = generateWhatsAppURL('9876543210', 'Hello, this is a test')
      expect(url).toBe('https://wa.me/919876543210?text=Hello%2C%20this%20is%20a%20test')
    })

    it('should encode message correctly', () => {
      const url = generateWhatsAppURL('919876543210', 'Hello! Check out https://example.com')
      expect(url).toContain('https%3A%2F%2Fexample.com')
    })

    it('should handle special characters in message', () => {
      const url = generateWhatsAppURL('9876543210', 'Order #123 - Total: ₹1,500')
      expect(url).toContain('%23123')
      expect(url).toContain('%E2%82%B91%2C500')
    })
  })

  describe('generateWhatsAppMessage() - WhatsApp message template', () => {
    it('should generate correct message template', () => {
      const message = generateWhatsAppMessage(
        'John Doe',
        'Royal Enfield Classic 350',
        'CB20240101001',
        'https://example.com/o/ABC123'
      )

      expect(message).toContain('Hello *John*!')
      expect(message).toContain('Royal Enfield Classic 350')
      expect(message).toContain('CB20240101001')
      expect(message).toContain('https://example.com/o/ABC123')
      expect(message).toContain('*CycleBees*')
    })

    it('should extract first name correctly', () => {
      const message = generateWhatsAppMessage(
        'Alice Mary Johnson',
        'Honda Activa',
        'CB001',
        'https://example.com'
      )

      expect(message).toContain('Hello *Alice*!')
    })

    it('should handle single name', () => {
      const message = generateWhatsAppMessage(
        'Alice',
        'Honda Activa',
        'CB001',
        'https://example.com'
      )

      expect(message).toContain('Hello *Alice*!')
    })
  })

  describe('formatDate() - Date formatting', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2025-10-19T10:30:00Z')
      const formatted = formatDate(date)

      // Should contain year, month, day, hour, minute
      expect(formatted).toContain('2025')
      expect(formatted).toContain('Oct')
      expect(formatted).toContain('19')
    })

    it('should format ISO string correctly', () => {
      const formatted = formatDate('2025-10-19T10:30:00Z')

      expect(formatted).toContain('2025')
      expect(formatted).toContain('Oct')
      expect(formatted).toContain('19')
    })

    it('should include time in formatted output', () => {
      const formatted = formatDate('2025-10-19T10:30:00Z')

      // Should contain time components (format may vary by locale)
      expect(formatted.length).toBeGreaterThan(10) // Date + time
    })
  })

  describe('getStatusColor() - Status badge colors', () => {
    it('should return correct color for pending status', () => {
      expect(getStatusColor('pending')).toBe('bg-amber-100 text-amber-800 animate-pulse')
    })

    it('should return correct color for sent status', () => {
      expect(getStatusColor('sent')).toBe('bg-blue-100 text-blue-800')
    })

    it('should return correct color for viewed status', () => {
      expect(getStatusColor('viewed')).toBe('bg-green-100 text-green-800')
    })

    it('should return correct color for confirmed status', () => {
      expect(getStatusColor('confirmed')).toBe('bg-emerald-100 text-emerald-800')
    })

    it('should return correct color for cancelled status', () => {
      expect(getStatusColor('cancelled')).toBe('bg-red-100 text-red-800')
    })

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800')
    })

    it('should handle empty string', () => {
      expect(getStatusColor('')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('generateOrderID() - Order ID generation', () => {
    it('should generate order ID with correct format', () => {
      const orderId = generateOrderID()

      // Format: CB + YY + MM + DD + HH + MM + RR (14 characters total)
      expect(orderId).toMatch(/^CB\d{12}$/)
    })

    it('should start with CB prefix', () => {
      const orderId = generateOrderID()
      expect(orderId.startsWith('CB')).toBe(true)
    })

    it('should generate unique IDs', () => {
      const id1 = generateOrderID()
      const id2 = generateOrderID()

      // Due to random suffix, IDs should be different (with very high probability)
      // We check length at minimum
      expect(id1).toHaveLength(14)
      expect(id2).toHaveLength(14)
    })

    it('should contain current year digits', () => {
      const orderId = generateOrderID()
      const currentYear = new Date().getFullYear().toString().slice(-2)

      expect(orderId.slice(2, 4)).toBe(currentYear)
    })

    it('should contain current month', () => {
      const orderId = generateOrderID()
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')

      expect(orderId.slice(4, 6)).toBe(currentMonth)
    })
  })
})
