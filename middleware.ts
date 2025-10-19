import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth-edge'

// Define which API routes require authentication (admin only)
const protectedApiRoutes = [
  '/api/requests', // Admin only - request management
  '/api/analytics', // Admin only - business analytics
  // Note: /api/addons, /api/bundles, /api/pricing are PUBLIC (customers need these)
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Handle admin page redirects
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('adminAuth')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const payload = await verifyTokenEdge(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // 2. Protect API routes with JWT verification
  const isProtectedApi = protectedApiRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedApi) {
    // Try to get token from Authorization header first
    let token = request.headers.get('Authorization')?.replace('Bearer ', '')

    // If no Authorization header, try cookie
    if (!token) {
      token = request.cookies.get('adminAuth')?.value
    }

    // If still no token, return unauthorized
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    // Verify the token
    const payload = await verifyTokenEdge(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      )
    }

    // Token is valid, add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-username', payload.username)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
