import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// /api/cron and /api/leads are public to the proxy because those routes check their own secret
const PUBLIC_PATHS = [
  '/login', '/forgot-password', '/auth', '/terms', '/privacy', '/contact', '/pricing', '/locked',
  '/api/cron', '/manifest.webmanifest', '/robots.txt', '/sitemap.xml',
]

// Runs on every request. Its only jobs: keep the session cookie fresh and send visitors
// without a session away from private pages. Role and subscription checks happen in the
// layouts/pages (one cached database call), so this stays fast.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )

  // getClaims() verifies the token's signature locally (no network call when the project uses
  // asymmetric JWT keys) and refreshes it when it is about to expire.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)

  const path = request.nextUrl.pathname
  const isPublic = path === '/' || PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const res = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }
  return response
}
