import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Protected user routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      
      // Redirect pending users to waiting page
      if (token.status === 'PENDING') {
        return NextResponse.redirect(new URL('/pending', req.url))
      }
      
      // Block users with REJECTED status
      if (token.status === 'REJECTED') {
        return NextResponse.redirect(new URL('/rejected', req.url))
      }
      
      // Block users with BLOCKED status or zero credits (immediate blocking)
      if (token.status === 'BLOCKED' || token.credits <= 0) {
        return NextResponse.redirect(new URL('/blocked', req.url))
      }
    }

    // API routes protection
    if (pathname.startsWith('/api/admin')) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    if (pathname.startsWith('/api/protected')) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      if (token.status === 'REJECTED') {
        return NextResponse.json(
          { success: false, error: 'Account has been rejected' },
          { status: 403 }
        )
      }
      
      if (token.status === 'PENDING') {
        return NextResponse.json(
          { success: false, error: 'Account is pending approval' },
          { status: 403 }
        )
      }
      
      // Critical: Block API access when credits reach 0
      if (token.status === 'BLOCKED' || token.credits <= 0) {
        return NextResponse.json(
          { success: false, error: 'Access denied: No credits remaining' },
          { status: 403 }
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public routes
        if (
          pathname.startsWith('/auth') ||
          pathname === '/' ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon')
        ) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}