import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { mailConfigured, sendReminderDigestEmail } from '@/lib/mail'
import { makeFormatters } from '@/lib/format'
import { addDaysISO, dayRangeUtc, todayISO } from '@/lib/tz'

type EventRow = {
  id: string; lawyer_id: string; case_id: string | null; title: string
  kind: 'hearing' | 'meeting' | 'deadline' | 'other'; starts_at: string; visible_to_client: boolean
}
type TaskRow = { id: string; lawyer_id: string; assigned_to: string | null; title: string; due_date: string }

const KIND = {
  hearing: { en: 'Hearing', ur: 'سماعت' },
  meeting: { en: 'Meeting', ur: 'ملاقات' },
  deadline: { en: 'Deadline', ur: 'آخری تاریخ' },
  other: { en: 'Event', ur: 'تقریب' },
} as const

export interface ReminderSummary { events: number; tasks: number; emails: number; skippedLockedFirms: number; errors: number }

// Everything happening TOMORROW (in the firm time zone) and tasks due by tomorrow, one digest per person.
// Each event/task is reminded once (reminded_at). Firms whose workspace is locked are skipped.
export async function runReminderJob(locked: Set<string>, site: string): Promise<ReminderSummary> {
  const out: ReminderSummary = { events: 0, tasks: 0, emails: 0, skippedLockedFirms: 0, errors: 0 }
  if (!mailConfigured()) return out

  const admin = createAdminClient()
  const tomorrow = addDaysISO(todayISO(), 1)
  const range = dayRangeUtc(tomorrow)
  const en = makeFormatters('en')

  const [evRes, taskRes] = await Promise.all([
    admin.from('events').select('id, lawyer_id, case_id, title, kind, starts_at, visible_to_client')
      .is('reminded_at', null).gte('starts_at', range.from).lt('starts_at', range.to),
    admin.from('tasks').select('id, lawyer_id, assigned_to, title, due_date')
      .is('reminded_at', null).eq('done', false).not('due_date', 'is', null).lte('due_date', tomorrow),
  ])
  if (evRes.error || taskRes.error) { out.errors++; return out }

  const events = ((evRes.data ?? []) as EventRow[]).filter((e) => (locked.has(e.lawyer_id) ? (out.skippedLockedFirms++, false) : true))
  const tasks = ((taskRes.data ?? []) as TaskRow[]).filter((t) => (locked.has(t.lawyer_id) ? (out.skippedLockedFirms++, false) : true))
  out.events = events.length
  out.tasks = tasks.length

  // the client behind each shared event
  const caseIds = [...new Set(events.filter((e) => e.visible_to_client && e.case_id).map((e) => e.case_id as string))]
  const caseClient = new Map<string, string>()
  if (caseIds.length) {
    const { data } = await admin.from('cases').select('id, client_id').in('id', caseIds)
    for (const c of (data ?? []) as { id: string; client_id: string }[]) caseClient.set(c.id, c.client_id)
  }

  const digest = new Map<string, { en: string; ur: string }[]>()
  const add = (userId: string, line: { en: string; ur: string }) => digest.set(userId, [...(digest.get(userId) ?? []), line])

  for (const e of events) {
    const k = KIND[e.kind] ?? KIND.other
    const when = `${en.date(e.starts_at)} ${en.time(e.starts_at)}`
    const line = { en: `${k.en}: ${e.title} (${when})`, ur: `${k.ur}: ${e.title} (${when})` }
    add(e.lawyer_id, line)
    const clientId = e.visible_to_client && e.case_id ? caseClient.get(e.case_id) : undefined
    if (clientId) add(clientId, line)
  }
  const today = todayISO()
  for (const t of tasks) {
    const late = t.due_date < today
    add(t.assigned_to ?? t.lawyer_id, {
      en: `Task ${late ? 'overdue' : 'due'}: ${t.title} (${en.date(t.due_date)})`,
      ur: `ٹاسک ${late ? 'مقررہ تاریخ گزر چکی' : 'مقررہ تاریخ'}: ${t.title} (${en.date(t.due_date)})`,
    })
  }

  if (digest.size) {
    const { data: people } = await admin
      .from('profiles').select('id, email, full_name, notify_email, is_active').in('id', [...digest.keys()])
    for (const p of (people ?? []) as { id: string; email: string; full_name: string | null; notify_email: boolean; is_active: boolean }[]) {
      if (!p.is_active || !p.notify_email) continue
      const res = await sendReminderDigestEmail({
        to: p.email, name: p.full_name ?? p.email, lines: digest.get(p.id) ?? [], link: site,
      })
      if (res.ok) out.emails++
      else out.errors++
    }
  }

  // stamp everything processed (also for people who opted out, so it is not re-evaluated every day)
  const stamp = new Date().toISOString()
  if (events.length) await admin.from('events').update({ reminded_at: stamp }).in('id', events.map((e) => e.id))
  if (tasks.length) await admin.from('tasks').update({ reminded_at: stamp }).in('id', tasks.map((t) => t.id))
  return out
}
