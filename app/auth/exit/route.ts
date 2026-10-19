import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

// Signs the person out and shows a message on the login page (suspended account, etc.).
export async function GET(request: NextRequest) {
  const error = new URL(request.url).searchParams.get('error') ?? ''
  const supabase = await createClient()
  await supabase.auth.signOut()
  const site = await getSiteUrl()
  const to = new URL('/login', site)
  if (/^[a-z_]{1,30}$/.test(error)) to.searchParams.set('error', error)
  return NextResponse.redirect(to)
}
