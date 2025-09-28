import { z } from 'zod'

// Request validation schema
export const requestSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required').max(100, 'Order ID too long'),
  bike_name: z.string().min(1, 'Bike name is required').max(200, 'Bike name too long'),
  customer_name: z.string().min(1, 'Customer name is required').max(200, 'Customer name too long'),
  phone_digits_intl: z.string()
    .regex(/^\d{10,15}$/, 'Phone number must be 10-15 digits without + or spaces')
    .transform((phone) => {
      // Auto-add 91 prefix for 10-digit Indian numbers
      if (phone.length === 10 && !phone.startsWith('91')) {
        return '91' + phone
      }
      return phone
    }),
  status: z.enum(['draft', 'sent', 'viewed', 'confirmed', 'cancelled']),
})

// Request item validation schema
export const requestItemSchema = z.object({
  section: z.enum(['repair', 'replacement']),
  label: z.string().min(1, 'Item name is required').max(500, 'Item name too long'),
  price_paise: z.number()
    .int('Price must be a whole number')
    .min(1, 'Price must be greater than 0')
    .max(10000000, 'Price too high'), // Max ₹1,00,000
  is_suggested: z.boolean(),
})

// Complete request with items schema
export const createRequestSchema = z.object({
  request: requestSchema,
  repair_items: z.array(requestItemSchema.omit({ section: true })).min(0),
  replacement_items: z.array(requestItemSchema.omit({ section: true })).min(0),
})

// Customer order selection schema (for estimate viewing and confirmation)
export const customerOrderSchema = z.object({
  selected_items: z.array(z.string().uuid()).min(0),
  selected_addons: z.array(z.string().uuid()).optional().default([]),
  selected_bundles: z.array(z.string().uuid()).optional().default([]),
  status: z.enum(['viewed', 'confirmed']).optional(),
})

export type RequestFormData = z.infer<typeof requestSchema>
export type RequestItemFormData = z.infer<typeof requestItemSchema>
export type CreateRequestData = z.infer<typeof createRequestSchema>
export type CustomerOrderData = z.infer<typeof customerOrderSchema>