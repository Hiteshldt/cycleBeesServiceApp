// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill TextEncoder/TextDecoder for jsdom environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock jose module to handle ESM-only package in Jest
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation((payload) => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockImplementation(async () => {
      // Generate a realistic-looking JWT token for testing
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64')
      const signature = Buffer.from('mock-signature').toString('base64')
      return `${header}.${payloadStr}.${signature}`
    }),
  })),
  jwtVerify: jest.fn().mockImplementation(async (token) => {
    // Parse the mocked token to extract payload
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token')
    }
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      return { payload }
    } catch {
      throw new Error('Invalid token')
    }
  }),
}))
