import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Handle auth redirects
  const redirectUrl = req.nextUrl.clone()
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isApiPage = req.nextUrl.pathname.startsWith('/api')

  // If user is signed in and tries to access auth page, redirect to home
  if (session && isAuthPage) {
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is not signed in and tries to access protected pages
  if (!session && !isAuthPage && !isApiPage) {
    // Store the original URL in the searchParams
    redirectUrl.pathname = '/auth/signin'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
