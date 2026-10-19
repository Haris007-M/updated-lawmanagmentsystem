import { dateOfInstant, localToUtcISO } from '@/lib/tz'
import type { SubStatus } from '@/lib/types'

// Subscription statuses a super admin may set by hand ("past_due" is worked out from the dates, never set).
export const MANUAL_STATUSES = ['trial', 'active', 'suspended', 'canceled'] as const
export const LEAD_STATUSES = ['new', 'contacted', 'won', 'lost'] as const
export const PAYMENT_STATUSES = ['pending', 'confirmed', 'rejected'] as const
export const EXTEND_MONTHS = [1, 3, 6, 12] as const

// "2026-11-30" typed by the admin -> the END of that day in the firm's time zone (as a UTC instant)
export const dayEndUtc = (date: string): string | null =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) ? localToUtcISO(`${date}T23:59`) : null

// stored instant -> "2026-11-30" for <input type="date">
export const toDateInput = (iso: string | null | undefined): string => (iso ? dateOfInstant(iso) : '')

// The date the firm's access ends (trial end or paid period end), exactly like sub_end() in the database
export function subEnd(s: { status: SubStatus; trial_ends_at: string | null; current_period_end: string | null }): string | null {
  return s.status === 'trial' ? s.trial_ends_at : (s.current_period_end ?? s.trial_ends_at)
}

export const daysUntil = (iso: string | null | undefined): number | null =>
  iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null

// An instant `days` from now, as an ISO string (kept here so pages stay free of impure calls)
export const inDaysIso = (days: number): string => new Date(Date.now() + days * 86_400_000).toISOString()
