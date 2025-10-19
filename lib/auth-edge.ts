/**
 * Auth utilities for Edge Runtime (Middleware)
 * Uses jose library which is compatible with Edge Runtime
 */

import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  username: string
}

// For middleware (Edge runtime) - uses jose library
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Validate payload has required fields
    if (payload && typeof payload.userId === 'string' && typeof payload.username === 'string') {
      return {
        userId: payload.userId,
        username: payload.username,
      }
    }
    return null
  } catch (error) {
    return null
  }
}

// For API routes (Edge compatible token generation)
export async function generateTokenEdge(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  return token
}
