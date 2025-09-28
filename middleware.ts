import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirect /admin to /admin/login if not authenticated
  if (request.nextUrl.pathname === '/admin') {
    const adminAuth = request.cookies.get('adminAuth')
    if (!adminAuth) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}