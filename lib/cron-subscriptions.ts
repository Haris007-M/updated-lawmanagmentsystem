import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { mailConfigured, sendSubscriptionReminderEmail, type SubscriptionReminderKind } from '@/lib/mail'
import { dayRangeUtc, todayISO } from '@/lib/tz'
import type { SubStatus } from '@/lib/types'

export interface SubRow {
  firm_id: string
  status: SubStatus
  trial_ends_at: string | null
  current_period_end: string | null
  grace_days: number
  last_reminder_at: string | null
}

const DAY = 86_400_000

// Mirror of the SQL function sub_effective(): what state is the subscription REALLY in right now?
export function subEnd(s: SubRow): Date | null {
  const v = s.status === 'trial' ? s.trial_ends_at : (s.current_period_end ?? s.trial_ends_at)
  return v ? new Date(v) : null
}

export function effectiveStatus(s: SubRow, now = new Date()): SubStatus {
  if (s.status === 'suspended' || s.status === 'canceled') return s.status
  const end = subEnd(s)
  const base: SubStatus = s.status === 'past_due' ? 'active' : s.status
  if (!end) return base
  if (now <= end) return base
  if (now.getTime() <= end.getTime() + s.grace_days * DAY) return 'past_due'
  return 'suspended'
}

// The firms whose workspace is locked right now (used by other jobs to skip them)
export function lockedFirms(rows: SubRow[]): Set<string> {
  const out = new Set<string>()
  for (const r of rows) {
    const e = effectiveStatus(r)
    if (e === 'suspended' || e === 'canceled') out.add(r.firm_id)
  }
  return out
}

export async function loadSubscriptions(): Promise<SubRow[]> {
  const { data, error } = await createAdminClient()
    .from('subscriptions')
    .select('firm_id, status, trial_ends_at, current_period_end, grace_days, last_reminder_at')
  if (error) throw new Error(`subscriptions: ${error.message}`)
  return (data ?? []) as SubRow[]
}

export interface SubSummary {
  checked: number
  movedToPastDue: number
  movedToSuspended: number
  reminders: number
  errors: number
}

// 1) store the real status (never un-suspends: a suspended/canceled firm only comes back when a payment is confirmed)
// 2) email the firm owner at most once per day, only on the days that matter
export async function runSubscriptionJob(rows: SubRow[], site: string): Promise<SubSummary> {
  const admin = createAdminClient()
  const now = new Date()
  const out: SubSummary = { checked: rows.length, movedToPastDue: 0, movedToSuspended: 0, reminders: 0, errors: 0 }
  const today0 = dayRangeUtc(todayISO()).from // start of today in the firm time zone

  const justSuspended = new Set<string>()
  for (const s of rows) {
    const eff = effectiveStatus(s, now)
    if ((eff === 'past_due' || eff === 'suspended') && eff !== s.status) {
      const { error } = await admin.from('subscriptions').update({ status: eff }).eq('firm_id', s.firm_id)
      if (error) { out.errors++; continue }
      if (eff === 'past_due') out.movedToPastDue++
      else { out.movedToSuspended++; justSuspended.add(s.firm_id) }
      s.status = eff
    }
  }

  if (!mailConfigured()) return out

  const owners = new Map<string, { email: string; full_name: string | null; is_active: boolean }>()
  if (rows.length) {
    const { data } = await admin.from('profiles').select('id, email, full_name, is_active').in('id', rows.map((r) => r.firm_id))
    for (const p of (data ?? []) as { id: string; email: string; full_name: string | null; is_active: boolean }[]) owners.set(p.id, p)
  }

  for (const s of rows) {
    if (s.last_reminder_at && s.last_reminder_at >= today0) continue // already emailed today
    const owner = owners.get(s.firm_id)
    if (!owner?.is_active) continue

    const eff = effectiveStatus(s, now)
    const end = subEnd(s)
    let kind: SubscriptionReminderKind | null = null
    if (eff === 'trial' && end) {
      const left = Math.ceil((end.getTime() - now.getTime()) / DAY)
      if (left === 3) kind = 'trial3'
      else if (left === 1) kind = 'trial1'
    } else if (eff === 'active' && end) {
      if (Math.ceil((end.getTime() - now.getTime()) / DAY) === 5) kind = 'period5'
    } else if (eff === 'past_due') {
      kind = 'past_due'
    } else if (eff === 'suspended' && justSuspended.has(s.firm_id)) {
      kind = 'suspended' // once, on the day it happens
    }
    if (!kind) continue

    const res = await sendSubscriptionReminderEmail({
      to: owner.email,
      name: owner.full_name ?? owner.email,
      kind,
      link: `${site}/lawyer/subscription`,
      graceDays: s.grace_days,
    })
    if (res.ok) {
      out.reminders++
      await admin.from('subscriptions').update({ last_reminder_at: now.toISOString() }).eq('firm_id', s.firm_id)
    } else out.errors++
  }
  return out
}
