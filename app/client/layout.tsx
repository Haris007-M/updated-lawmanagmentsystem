import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getContext } from '@/lib/auth'
import { CLIENT_NAV } from '@/lib/nav'
import { ROLE_HOME } from '@/lib/types'

// Every client page and action still calls requireRole('client') itself.
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const me = await getContext()
  if (!me) redirect('/login')
  if (!me.access_active) redirect('/auth/exit?error=inactive')
  if (me.role !== 'client') redirect(ROLE_HOME[me.role])
  if (!me.mfa_ok) redirect('/login/verify')
  if (me.billing === 'locked') redirect('/locked')
  return <AppShell me={me} nav={CLIENT_NAV}>{children}</AppShell>
}
