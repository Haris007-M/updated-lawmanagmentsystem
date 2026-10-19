import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'
import { safeNext } from '@/lib/redirect'

// Handles the PKCE ?code=... flow used by the default Supabase password-reset email
// (requested from /forgot-password, see requestPasswordReset).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'), '/auth/set-password')
  const site = await getSiteUrl()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, site))
  }

  return NextResponse.redirect(new URL('/login?error=invalid_link', site))
}
