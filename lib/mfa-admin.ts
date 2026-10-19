import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

// Removes every authenticator factor of a user (lost phone). Caller must have
// verified that the acting person is allowed to do this for THIS user.
export async function resetUserMfa(userId: string): Promise<boolean> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  const list = await fetch(`${url}/auth/v1/admin/users/${userId}/factors`, { headers })
  if (!list.ok) {
    console.error('list factors failed:', list.status)
    return false
  }
  const body = await list.json()
  const factors: { id: string }[] = Array.isArray(body) ? body : (body?.factors ?? [])

  for (const f of factors) {
    const del = await fetch(`${url}/auth/v1/admin/users/${userId}/factors/${f.id}`, { method: 'DELETE', headers })
    if (!del.ok) {
      console.error('delete factor failed:', del.status)
      return false
    }
  }
  await createAdminClient().from('profiles').update({ mfa_enabled: false }).eq('id', userId)
  return true
}
