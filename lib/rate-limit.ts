import 'server-only'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function clientIp(): Promise<string> {
  const h = await headers()
  // Behind Vercel / a trusted reverse proxy, x-forwarded-for is set by the proxy.
  return (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim()
}

// Returns true if the action is allowed, false if the limit is hit.
// Fails CLOSED: if the limiter itself errors, the action is refused.
export async function allow(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc('rate_limit_hit', {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('rate_limit_hit failed (did you re-run supabase/schema.sql?):', error.message)
    return false
  }
  return data === true
}
