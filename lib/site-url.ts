import 'server-only'
import { headers } from 'next/headers'

// Public origin of the app, used to build links we hand to users.
// Set NEXT_PUBLIC_SITE_URL in production; otherwise it is derived from the request.
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  if (fromEnv) return fromEnv

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
