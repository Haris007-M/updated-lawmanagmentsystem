import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getContext } from '@/lib/auth'
import { ADMIN_NAV } from '@/lib/nav'
import { ROLE_HOME } from '@/lib/types'

// Every admin page and action still calls requireRole('super_admin') itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getContext()
  if (!me) redirect('/login')
  if (!me.access_active) redirect('/auth/exit?error=inactive')
  if (me.role !== 'super_admin') redirect(ROLE_HOME[me.role])
  if (!me.mfa_ok) redirect('/login/verify')
  return <AppShell me={me} nav={ADMIN_NAV}>{children}</AppShell>
}
