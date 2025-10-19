import {
  requestSchema,
  requestItemSchema,
  createRequestSchema,
  customerOrderSchema,
} from '@/lib/validations'

describe('lib/validations', () => {
  describe('requestSchema', () => {
    it('should validate a correct request object', () => {
      const validRequest = {
        order_id: 'CB2024100112345678',
        bike_name: 'Royal Enfield Classic 350',
        customer_name: 'John Doe',
        phone_digits_intl: '9876543210',
        status: 'pending' as const,
        lacarte_paise: 150000,
      }

      const result = requestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phone_digits_intl).toBe('919876543210') // Auto-adds 91
      }
    })

    it('should auto-add 91 prefix to 10-digit Indian numbers', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phone_digits_intl).toBe('919876543210')
      }
    })

    it('should not modify already prefixed 12-digit numbers', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '919876543210',
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phone_digits_intl).toBe('919876543210')
      }
    })

    it('should reject empty order_id', () => {
      const request = {
        order_id: '',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject order_id longer than 100 characters', () => {
      const request = {
        order_id: 'A'.repeat(101),
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject empty bike_name', () => {
      const request = {
        order_id: 'CB001',
        bike_name: '',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject empty customer_name', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: '',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject invalid phone numbers (too short)', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '987654321', // 9 digits
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject invalid phone numbers (too long)', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210123456', // 16 digits
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject phone numbers with non-digit characters', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '+91 98765 43210',
        status: 'sent' as const,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should validate all status values', () => {
      const statuses = ['pending', 'sent', 'viewed', 'confirmed', 'cancelled'] as const

      statuses.forEach((status) => {
        const request = {
          order_id: 'CB001',
          bike_name: 'Honda Activa',
          customer_name: 'Alice',
          phone_digits_intl: '9876543210',
          status,
        }

        const result = requestSchema.safeParse(request)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'invalid_status',
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should accept optional lacarte_paise', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
        lacarte_paise: 150000,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should accept null lacarte_paise', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
        lacarte_paise: null,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should reject negative lacarte_paise', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
        lacarte_paise: -1000,
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject lacarte_paise exceeding max value', () => {
      const request = {
        order_id: 'CB001',
        bike_name: 'Honda Activa',
        customer_name: 'Alice',
        phone_digits_intl: '9876543210',
        status: 'sent' as const,
        lacarte_paise: 10000001, // Over 10M
      }

      const result = requestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })
  })

  describe('requestItemSchema', () => {
    it('should validate a correct request item', () => {
      const validItem = {
        section: 'repair' as const,
        label: 'Engine oil change',
        price_paise: 15000,
        is_suggested: true,
      }

      const result = requestItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('should validate both section types', () => {
      const repairItem = {
        section: 'repair' as const,
        label: 'Brake adjustment',
        price_paise: 10000,
        is_suggested: true,
      }

      const replacementItem = {
        section: 'replacement' as const,
        label: 'Air filter',
        price_paise: 8500,
        is_suggested: false,
      }

      expect(requestItemSchema.safeParse(repairItem).success).toBe(true)
      expect(requestItemSchema.safeParse(replacementItem).success).toBe(true)
    })

    it('should reject invalid section', () => {
      const item = {
        section: 'invalid',
        label: 'Engine oil change',
        price_paise: 15000,
        is_suggested: true,
      }

      const result = requestItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })

    it('should reject empty label', () => {
      const item = {
        section: 'repair' as const,
        label: '',
        price_paise: 15000,
        is_suggested: true,
      }

      const result = requestItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })

    it('should reject label longer than 500 characters', () => {
      const item = {
        section: 'repair' as const,
        label: 'A'.repeat(501),
        price_paise: 15000,
        is_suggested: true,
      }

      const result = requestItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })

    it('should reject zero price', () => {
      const item = {
        section: 'repair' as const,
        label: 'Free service',
        price_paise: 0,
        is_suggested: true,
      }

      const result = requestItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })

    it('should reject negative price', () => {
      const item = {
        section: 'repair' as const,
        label: 'Discount',
        price_paise: -1000,
        is_suggested: true,
      }

      const result = requestItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })

    it('should reject price exceeding max value', () => {
      const item = {
        section: 'repair' as const,
        label: 'Expensive service',
        price_paise: 10000001,
        is_suggested: true,
      }

      const result = requestItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })

    it('should accept boolean is_suggested', () => {
      const item1 = {
        section: 'repair' as const,
        label: 'Service 1',
        price_paise: 10000,
        is_suggested: true,
      }

      const item2 = {
        section: 'repair' as const,
        label: 'Service 2',
        price_paise: 10000,
        is_suggested: false,
      }

      expect(requestItemSchema.safeParse(item1).success).toBe(true)
      expect(requestItemSchema.safeParse(item2).success).toBe(true)
    })
  })

  describe('createRequestSchema', () => {
    it('should validate a complete request with items', () => {
      const validData = {
        request: {
          order_id: 'CB001',
          bike_name: 'Royal Enfield Classic 350',
          customer_name: 'John Doe',
          phone_digits_intl: '9876543210',
          status: 'pending' as const,
          lacarte_paise: 150000,
        },
        repair_items: [
          {
            label: 'Engine oil change',
            price_paise: 15000,
            is_suggested: true,
          },
        ],
        replacement_items: [
          {
            label: 'Air filter',
            price_paise: 8500,
            is_suggested: false,
          },
        ],
      }

      const result = createRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty repair_items array', () => {
      const data = {
        request: {
          order_id: 'CB001',
          bike_name: 'Honda Activa',
          customer_name: 'Alice',
          phone_digits_intl: '9876543210',
          status: 'sent' as const,
        },
        repair_items: [],
        replacement_items: [
          {
            label: 'Brake pad',
            price_paise: 12000,
            is_suggested: true,
          },
        ],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept empty replacement_items array', () => {
      const data = {
        request: {
          order_id: 'CB001',
          bike_name: 'Honda Activa',
          customer_name: 'Alice',
          phone_digits_intl: '9876543210',
          status: 'sent' as const,
        },
        repair_items: [
          {
            label: 'Oil change',
            price_paise: 15000,
            is_suggested: true,
          },
        ],
        replacement_items: [],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid request data', () => {
      const data = {
        request: {
          order_id: '', // Invalid
          bike_name: 'Honda Activa',
          customer_name: 'Alice',
          phone_digits_intl: '9876543210',
          status: 'sent' as const,
        },
        repair_items: [],
        replacement_items: [],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid repair_items', () => {
      const data = {
        request: {
          order_id: 'CB001',
          bike_name: 'Honda Activa',
          customer_name: 'Alice',
          phone_digits_intl: '9876543210',
          status: 'sent' as const,
        },
        repair_items: [
          {
            label: 'Oil change',
            price_paise: 0, // Invalid: must be > 0
            is_suggested: true,
          },
        ],
        replacement_items: [],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('customerOrderSchema', () => {
    it('should validate customer order with selected items', () => {
      const validOrder = {
        selected_items: [
          '123e4567-e89b-12d3-a456-426614174000',
          '223e4567-e89b-12d3-a456-426614174001',
        ],
        selected_addons: ['323e4567-e89b-12d3-a456-426614174002'],
        selected_bundles: [],
        status: 'viewed' as const,
      }

      const result = customerOrderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })

    it('should accept empty selected arrays with defaults', () => {
      const order = {
        selected_items: [],
      }

      const result = customerOrderSchema.safeParse(order)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.selected_addons).toEqual([])
        expect(result.data.selected_bundles).toEqual([])
      }
    })

    it('should validate status as viewed or confirmed', () => {
      const order1 = {
        selected_items: [],
        status: 'viewed' as const,
      }

      const order2 = {
        selected_items: [],
        status: 'confirmed' as const,
      }

      expect(customerOrderSchema.safeParse(order1).success).toBe(true)
      expect(customerOrderSchema.safeParse(order2).success).toBe(true)
    })

    it('should reject invalid status', () => {
      const order = {
        selected_items: [],
        status: 'pending',
      }

      const result = customerOrderSchema.safeParse(order)
      expect(result.success).toBe(false)
    })

    it('should reject non-UUID strings in selected_items', () => {
      const order = {
        selected_items: ['not-a-uuid', 'also-not-uuid'],
      }

      const result = customerOrderSchema.safeParse(order)
      expect(result.success).toBe(false)
    })

    it('should accept valid UUIDs in all selected arrays', () => {
      const order = {
        selected_items: ['123e4567-e89b-12d3-a456-426614174000'],
        selected_addons: ['223e4567-e89b-12d3-a456-426614174001'],
        selected_bundles: ['323e4567-e89b-12d3-a456-426614174002'],
      }

      const result = customerOrderSchema.safeParse(order)
      expect(result.success).toBe(true)
    })
  })
})
