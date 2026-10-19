'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOwner, requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { dbError, getDate, getEnum, getStr, isUuid } from '@/lib/form'
import { BUCKET, CASE_STATUSES, CASE_TYPES, EVENT_KINDS, PRIORITIES } from '@/lib/constants'
import { localToUtcISO } from '@/lib/tz'
import { getI18n } from '@/lib/i18n'
import { searchConflicts, type ConflictHit } from '@/lib/lawyer-a-conflicts'
import type { ActionState } from '@/lib/types'

const optId = (v: string) => (isUuid(v) ? v : null)
const getLocalDateTime = (fd: FormData, key: string) => localToUtcISO(getStr(fd, key, 16))

function refreshCase(caseId?: string | null) {
  revalidatePath('/lawyer', 'layout')
  if (caseId) {
    revalidatePath(`/lawyer/cases/${caseId}`)
    revalidatePath(`/client/cases/${caseId}`)
  }
}

// ---------- Cases ----------
export async function createCase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const clientId = getStr(fd, 'client_id', 40)
  const title = getStr(fd, 'title', 200)
  const fields: Record<string, string> = {
    client_id: clientId, title, case_type: getStr(fd, 'case_type', 40), status: getStr(fd, 'status', 20),
    court: getStr(fd, 'court', 200), court_case_number: getStr(fd, 'court_case_number', 100), judge: getStr(fd, 'judge', 120),
    stage: getStr(fd, 'stage', 100), opposing_party: getStr(fd, 'opposing_party', 200),
    description: getStr(fd, 'description', 4000), opened_on: getStr(fd, 'opened_on', 10),
  }
  if (!isUuid(clientId)) return { error: t('la.err.chooseClient'), fields }
  if (!title) return { error: t('la.err.caseTitle'), fields }
  if (!(await allow(`case:${me.id}`, 60, 3600))) return { error: t('la.err.tooManyCases'), fields }

  const supabase = await createClient()

  // Conflict-of-interest check. The person confirms once ("create anyway") if anything turns up.
  if (fd.get('conflict_ack') !== 'on') {
    const { data: client } = await supabase.from('profiles').select('full_name').eq('id', clientId).maybeSingle()
    const [aboutOpposing, aboutClient] = await Promise.all([
      fields.opposing_party ? searchConflicts(supabase, [fields.opposing_party]) : Promise.resolve([]),
      client?.full_name ? searchConflicts(supabase, [client.full_name]) : Promise.resolve([]),
    ])
    const hits: ConflictHit[] = [
      ...aboutOpposing.filter((h) => h.kind === 'client' ? h.clientId !== clientId : h.kind === 'opposing'),
      ...aboutClient.filter((h) => h.kind === 'opposing'),
    ]
    if (hits.length) {
      return { error: t('la.conflict.found'), fields: { ...fields, conflicts: JSON.stringify(hits.slice(0, 10)) } }
    }
  }

  const { data, error } = await supabase
    .from('cases')
    .insert({
      lawyer_id: me.firm_id,
      client_id: clientId,
      title,
      case_type: getEnum(fd, 'case_type', CASE_TYPES, 'Other'),
      status: getEnum(fd, 'status', CASE_STATUSES, 'open'),
      court: fields.court || null,
      court_case_number: fields.court_case_number || null,
      judge: fields.judge || null,
      stage: fields.stage || null,
      opposing_party: fields.opposing_party || null,
      description: fields.description || null,
      opened_on: getDate(fd, 'opened_on') ?? undefined,
    })
    .select('id')
    .single()
  if (error || !data) return { error: error ? dbError(error) : t('la.err.caseCreate'), fields }

  await audit(me.id, 'case.created', data.id, { title })
  revalidatePath('/lawyer', 'layout')
  redirect(`/lawyer/cases/${data.id}`)
}

export async function updateCase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const id = getStr(fd, 'id', 40)
  const title = getStr(fd, 'title', 200)
  if (!isUuid(id)) return { error: t('la.err.caseNotFound') }
  if (!title) return { error: t('la.err.caseTitle') }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .update({
      title,
      case_type: getEnum(fd, 'case_type', CASE_TYPES, 'Other'),
      status: getEnum(fd, 'status', CASE_STATUSES, 'open'),
      court: getStr(fd, 'court', 200) || null,
      court_case_number: getStr(fd, 'court_case_number', 100) || null,
      judge: getStr(fd, 'judge', 120) || null,
      stage: getStr(fd, 'stage', 100) || null,
      opposing_party: getStr(fd, 'opposing_party', 200) || null,
      description: getStr(fd, 'description', 4000) || null,
    })
    .eq('id', id)
    .eq('lawyer_id', me.firm_id)
    .select('id')
    .maybeSingle()
  if (error) return { error: dbError(error) }
  if (!data) return { error: t('la.err.caseNotFound') }

  await audit(me.id, 'case.updated', id)
  refreshCase(id)
  return { success: t('la.case.updated') }
}

// Permanent. Messages, notes, documents, events and tasks of the case go with it
// (invoices stay, unlinked). Only the firm owner can do this, and must type the case number.
export async function deleteCase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireOwner()
  const id = getStr(fd, 'id', 40)
  const typed = getStr(fd, 'confirm', 60)
  if (!isUuid(id)) return { error: t('la.err.caseNotFound') }

  const supabase = await createClient()
  const { data: c } = await supabase.from('cases').select('id, case_number, title')
    .eq('id', id).eq('lawyer_id', me.firm_id).maybeSingle()
  if (!c) return { error: t('la.err.caseNotFound') }
  if (typed !== c.case_number) return { error: t('la.case.deleteMismatch', { number: c.case_number }) }

  const { data: docs } = await supabase.from('documents').select('storage_path').eq('case_id', id)
  const { data: deleted, error } = await supabase.from('cases').delete().eq('id', id).select('id')
  if (error) return { error: dbError(error) }
  if (!deleted?.length) return { error: t('la.err.caseNotFound') }

  const paths = ((docs ?? []) as { storage_path: string }[]).map((d) => d.storage_path)
  if (paths.length) await createAdminClient().storage.from(BUCKET).remove(paths)

  await audit(me.id, 'case.deleted', id, { case_number: c.case_number, title: c.title })
  revalidatePath('/lawyer', 'layout')
  revalidatePath('/client', 'layout')
  redirect('/lawyer/cases')
}

// ---------- Private notes ----------
export async function addNote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const caseId = getStr(fd, 'case_id', 40)
  const body = getStr(fd, 'body', 4000)
  if (!isUuid(caseId)) return { error: t('la.err.caseNotFound') }
  if (!body) return { error: t('la.notes.err.empty') }

  const supabase = await createClient()
  const { error } = await supabase.from('case_notes').insert({ case_id: caseId, author_id: me.id, body })
  if (error) return { error: dbError(error) }
  revalidatePath(`/lawyer/cases/${caseId}`)
  return { success: t('la.notes.saved') }
}

export async function deleteNote(fd: FormData) {
  await requireStaff()
  const id = getStr(fd, 'id', 40)
  const caseId = getStr(fd, 'case_id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  await supabase.from('case_notes').delete().eq('id', id) // RLS: own notes, or any note for the owner
  revalidatePath(`/lawyer/cases/${caseId}`)
}

// ---------- Tasks ----------
export async function addTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const title = getStr(fd, 'title', 200)
  if (!title) return { error: t('la.task.err.title') }
  const caseId = optId(getStr(fd, 'case_id', 40))
  const assignee = optId(getStr(fd, 'assigned_to', 40))

  const supabase = await createClient()
  const { error } = await supabase.from('tasks').insert({
    lawyer_id: me.firm_id,
    case_id: caseId,
    title,
    due_date: getDate(fd, 'due_date'),
    priority: getEnum(fd, 'priority', PRIORITIES, 'medium'),
    assigned_to: assignee,
  })
  if (error) return { error: dbError(error) }

  if (assignee && assignee !== me.id) {
    await notify({
      toUserId: assignee,
      subject: 'A task was assigned to you',
      heading: 'New task',
      body: `${me.full_name ?? me.email} assigned you a task: ${title}`,
      path: '/lawyer/tasks',
      button: 'View tasks',
    })
  }
  refreshCase(caseId)
  return { success: t('la.task.added') }
}

export async function updateTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const id = getStr(fd, 'id', 40)
  const title = getStr(fd, 'title', 200)
  if (!isUuid(id)) return { error: t('la.task.err.notFound') }
  if (!title) return { error: t('la.task.err.title') }
  const assignee = optId(getStr(fd, 'assigned_to', 40))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title,
      due_date: getDate(fd, 'due_date'),
      priority: getEnum(fd, 'priority', PRIORITIES, 'medium'),
      case_id: optId(getStr(fd, 'case_id', 40)),
      assigned_to: assignee,
    })
    .eq('id', id)
    .select('case_id')
    .maybeSingle()
  if (error) return { error: dbError(error) }
  if (!data) return { error: t('la.task.err.notFound') }
  // a changed date deserves a fresh reminder (this column is not writable from the browser session)
  await createAdminClient().from('tasks').update({ reminded_at: null }).eq('id', id).eq('lawyer_id', me.firm_id)
  refreshCase(data.case_id)
  return { success: t('la.task.updated') }
}

export async function toggleTask(fd: FormData) {
  await requireStaff()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks').update({ done: fd.get('done') === 'true' }).eq('id', id).select('case_id').maybeSingle()
  refreshCase(data?.case_id)
}

export async function deleteTask(fd: FormData) {
  await requireStaff()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { data } = await supabase.from('tasks').delete().eq('id', id).select('case_id').maybeSingle()
  refreshCase(data?.case_id)
}

// ---------- Calendar and hearings ----------
async function tellClientAboutEvent(caseId: string, subject: string, body: string) {
  const supabase = await createClient()
  const { data: c } = await supabase.from('cases').select('client_id, case_number').eq('id', caseId).maybeSingle()
  if (!c) return
  await notify({
    toUserId: c.client_id,
    subject: subject.replace('{n}', c.case_number),
    heading: subject.replace('{n}', c.case_number),
    body: body.replace('{n}', c.case_number),
    path: '/client/appointments',
    button: 'View appointments',
  })
}

export async function addEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const title = getStr(fd, 'title', 200)
  const startsAt = getLocalDateTime(fd, 'starts_at')
  if (!title) return { error: t('la.event.err.title') }
  if (!startsAt) return { error: t('la.event.err.when') }
  const caseId = optId(getStr(fd, 'case_id', 40))
  const visible = fd.get('visible_to_client') === 'on'
  if (visible && !caseId) return { error: t('la.event.err.needCase') }

  const supabase = await createClient()
  const { error } = await supabase.from('events').insert({
    lawyer_id: me.firm_id,
    case_id: caseId,
    title,
    kind: getEnum(fd, 'kind', EVENT_KINDS, 'meeting'),
    starts_at: startsAt,
    location: getStr(fd, 'location', 200) || null,
    notes: getStr(fd, 'notes', 1000) || null,
    visible_to_client: visible,
  })
  if (error) return { error: dbError(error) }

  if (visible && caseId) {
    await tellClientAboutEvent(caseId, 'New appointment on case {n}', 'A new appointment was added to case {n}. Sign in to see the date and details.')
  }
  revalidatePath('/client', 'layout')
  refreshCase(caseId)
  return { success: t('la.event.added') }
}

export async function updateEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const id = getStr(fd, 'id', 40)
  const title = getStr(fd, 'title', 200)
  const startsAt = getLocalDateTime(fd, 'starts_at')
  if (!isUuid(id)) return { error: t('la.event.err.notFound') }
  if (!title) return { error: t('la.event.err.title') }
  if (!startsAt) return { error: t('la.event.err.when') }
  const caseId = optId(getStr(fd, 'case_id', 40))
  const visible = fd.get('visible_to_client') === 'on'
  if (visible && !caseId) return { error: t('la.event.err.needCase') }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .update({
      title,
      kind: getEnum(fd, 'kind', EVENT_KINDS, 'meeting'),
      starts_at: startsAt,
      location: getStr(fd, 'location', 200) || null,
      notes: getStr(fd, 'notes', 1000) || null,
      case_id: caseId,
      visible_to_client: visible,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) return { error: dbError(error) }
  if (!data) return { error: t('la.event.err.notFound') }
  await createAdminClient().from('events').update({ reminded_at: null }).eq('id', id).eq('lawyer_id', me.firm_id) // new time = new reminder
  revalidatePath('/client', 'layout')
  refreshCase(caseId)
  return { success: t('la.event.updated') }
}

export async function deleteEvent(fd: FormData) {
  await requireStaff()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { data } = await supabase.from('events').delete().eq('id', id).select('case_id').maybeSingle()
  revalidatePath('/client', 'layout')
  refreshCase(data?.case_id)
}

// After a hearing: write down what happened and (optionally) the next date, which becomes a new hearing.
export async function recordOutcome(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const id = getStr(fd, 'id', 40)
  const outcome = getStr(fd, 'outcome', 1000)
  const nextAt = getLocalDateTime(fd, 'next_at')
  const stage = getStr(fd, 'stage', 100)
  if (!isUuid(id)) return { error: t('la.event.err.notFound') }
  if (!outcome && !nextAt) return { error: t('la.hearing.err.empty') }

  const supabase = await createClient()
  const { data: ev } = await supabase
    .from('events').select('id, case_id, title, location, visible_to_client, starts_at')
    .eq('id', id).eq('lawyer_id', me.firm_id).maybeSingle()
  if (!ev) return { error: t('la.event.err.notFound') }
  if (nextAt && new Date(nextAt).getTime() <= new Date(ev.starts_at).getTime()) return { error: t('la.hearing.err.nextBefore') }

  const { error } = await supabase.from('events').update({ outcome: outcome || null }).eq('id', id)
  if (error) return { error: dbError(error) }

  if (nextAt) {
    const { error: e2 } = await supabase.from('events').insert({
      lawyer_id: me.firm_id, case_id: ev.case_id, title: ev.title, kind: 'hearing', starts_at: nextAt,
      location: getStr(fd, 'next_location', 200) || ev.location, visible_to_client: ev.visible_to_client,
    })
    if (e2) return { error: dbError(e2) }
    if (ev.visible_to_client && ev.case_id) {
      await tellClientAboutEvent(ev.case_id, 'Next hearing date for case {n}', 'The next hearing date for case {n} was set. Sign in to see it.')
    }
  }
  if (stage && ev.case_id) await supabase.from('cases').update({ stage }).eq('id', ev.case_id)

  await audit(me.id, 'hearing.outcome', id)
  revalidatePath('/client', 'layout')
  refreshCase(ev.case_id)
  revalidatePath('/lawyer/cause-list')
  return { success: nextAt ? t('la.hearing.savedNext') : t('la.hearing.saved') }
}

// ---------- Time on a case (the full time page lives elsewhere) ----------
export async function addCaseTime(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const caseId = getStr(fd, 'case_id', 40)
  const description = getStr(fd, 'description', 500)
  const hours = Math.max(0, parseInt(getStr(fd, 'hours', 3), 10) || 0)
  const mins = Math.max(0, parseInt(getStr(fd, 'minutes', 3), 10) || 0)
  const minutes = hours * 60 + mins
  if (!isUuid(caseId)) return { error: t('la.err.caseNotFound') }
  if (!description) return { error: t('la.time.err.description') }
  if (minutes < 1 || minutes > 1440) return { error: t('la.time.err.duration') }

  const supabase = await createClient()
  const { data: prefs } = await supabase.from('firm_prefs').select('hourly_rate_cents').eq('firm_id', me.firm_id).maybeSingle()
  const { error } = await supabase.from('time_entries').insert({
    lawyer_id: me.firm_id, user_id: me.id, case_id: caseId,
    entry_date: getDate(fd, 'entry_date') ?? undefined,
    minutes, description, billable: fd.get('billable') === 'on',
    rate_cents: prefs?.hourly_rate_cents ?? 0,
  })
  if (error) return { error: dbError(error) }
  revalidatePath(`/lawyer/cases/${caseId}`)
  revalidatePath('/lawyer/time')
  return { success: t('la.time.added') }
}

export async function deleteCaseTime(fd: FormData) {
  await requireStaff()
  const id = getStr(fd, 'id', 40)
  const caseId = getStr(fd, 'case_id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  await supabase.from('time_entries').delete().eq('id', id).is('invoiced_invoice_id', null)
  revalidatePath(`/lawyer/cases/${caseId}`)
  revalidatePath('/lawyer/time')
}
