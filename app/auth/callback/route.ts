import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Get the site URL from environment variable or use the request origin
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
        const redirectUrl = new URL(next, siteUrl)
        return NextResponse.redirect(redirectUrl)
      } else {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(
          new URL('/auth/auth-code-error', requestUrl.origin)
        )
      }
    }

    // Return the user to an error page with some instructions
    return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(
      new URL('/auth/auth-code-error', requestUrl.origin)
    )
  }
}