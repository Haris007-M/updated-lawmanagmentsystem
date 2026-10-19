import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROLE_HOME, type Context, type UserRole } from '@/lib/types'

// ONE database round trip tells us who this is, whether they may come in, which firm they
// belong to and the state of the firm's subscription. cache() = layout, page and action
// in the same request share the answer.
export const getContext = cache(async (): Promise<Context | null> => {
  const supabase = await createClient()
  const { data } = await supabase.rpc('my_context')
  return (data as Context | null) ?? null
})

interface Options {
  // let a lawyer whose subscription expired still reach the page (the subscription page itself)
  allowLocked?: boolean
  // let a brand-new lawyer reach the page before finishing the welcome form
  allowUnonboarded?: boolean
}

// Any signed-in, active account (use in actions that every role may call).
export async function requireUser(opts: Options = {}): Promise<Context> {
  const me = await getContext()
  if (!me) redirect('/login')
  if (!me.access_active) redirect('/auth/exit?error=inactive')
  if (!me.mfa_ok) redirect('/login/verify') // password ok, 2FA code still needed

  if (me.billing === 'locked' && !opts.allowLocked && me.role !== 'super_admin') {
    // the owner can still renew; everyone else sees a "your firm's plan is inactive" page
    redirect(me.role === 'lawyer' ? '/lawyer/subscription' : '/locked')
  }
  if (me.role === 'lawyer' && !me.onboarded && !opts.allowUnonboarded) redirect('/lawyer/welcome')
  return me
}

// Call at the top of every protected page AND every server action
// (layouts alone are NOT enough: they do not re-run on client-side navigation).
export async function requireRole(role: UserRole, opts: Options = {}): Promise<Context> {
  const me = await requireUser(opts)
  if (me.role !== role) redirect(ROLE_HOME[me.role])
  return me
}

// Firm staff: the lawyer (owner) or a junior.
export async function requireStaff(opts: Options = {}): Promise<Context & { firm_id: string }> {
  const me = await requireUser(opts)
  if (me.role !== 'lawyer' && me.role !== 'junior') redirect(ROLE_HOME[me.role])
  return me as Context & { firm_id: string }
}

// The firm owner (the lawyer). Juniors are sent back to the dashboard.
export async function requireOwner(opts: Options = {}): Promise<Context & { firm_id: string }> {
  const me = await requireStaff(opts)
  if (me.role !== 'lawyer') redirect('/lawyer')
  return me
}
