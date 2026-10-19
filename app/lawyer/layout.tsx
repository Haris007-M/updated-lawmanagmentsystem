import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getContext } from '@/lib/auth'
import { JUNIOR_NAV, LAWYER_NAV, LOCKED_NAV } from '@/lib/nav'
import { ROLE_HOME } from '@/lib/types'

// The firm workspace: the lawyer (owner) and the firm's juniors.
// The layout only picks the menu. EVERY page and action still calls requireStaff()/requireOwner() itself
// (layouts do not re-run on client-side navigation, so they cannot be the only guard).
export default async function LawyerLayout({ children }: { children: React.ReactNode }) {
  const me = await getContext()
  if (!me) redirect('/login')
  if (!me.access_active) redirect('/auth/exit?error=inactive')
  if (me.role !== 'lawyer' && me.role !== 'junior') redirect(ROLE_HOME[me.role])
  if (!me.mfa_ok) redirect('/login/verify')

  const locked = me.billing === 'locked'
  if (locked && me.role === 'junior') redirect('/locked')
  const nav = locked ? LOCKED_NAV : me.role === 'lawyer' ? LAWYER_NAV : JUNIOR_NAV
  return <AppShell me={me} nav={nav}>{children}</AppShell>
}
