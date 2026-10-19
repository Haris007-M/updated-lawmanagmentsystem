import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getContext } from '@/lib/auth'
import { ROLE_HOME } from '@/lib/types'

// Public pages call this: a signed-in person goes straight to their own workspace.
// Anonymous visitors cost nothing (no cookie, no database call).
export async function redirectSignedIn(): Promise<void> {
  const jar = await cookies()
  if (!jar.getAll().some((c) => c.name.startsWith('sb-'))) return
  const me = await getContext()
  if (me && me.access_active) redirect(ROLE_HOME[me.role])
}
