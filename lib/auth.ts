/**
 * Auth utilities for Node.js Runtime (API Routes)
 * Uses bcrypt for password hashing - NOT compatible with Edge Runtime
 * For Edge Runtime utilities, use lib/auth-edge.ts
 */

import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify } from 'jose'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Password hashing utilities (Node.js only - uses bcrypt)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// JWT utilities
export interface JWTPayload {
  userId: string
  username: string
}

// Token generation (works in both Node.js and Edge)
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  return token
}

// Token verification (works in both Node.js and Edge)
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Validate payload has required fields
    if (payload && typeof payload.userId === 'string' && typeof payload.username === 'string') {
      return {
        userId: payload.userId,
        username: payload.username
      }
    }
    return null
  } catch (error) {
    return null
  }
}