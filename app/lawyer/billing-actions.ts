'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOwner, requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { notify, notifyAdmins } from '@/lib/notify'
import { dbError, getDate, getEnum, getMoneyCents, getStr, isUuid } from '@/lib/form'
import { getMoneyCentsAllowZero } from '@/lib/lawyer-b-form'
import { loadFirmPrefs } from '@/lib/lawyer-b-data'
import { CURRENCIES, MAX_PROOF_BYTES, PROOF_BUCKET, PROOF_FILES } from '@/lib/constants'
import { MONTH_OPTIONS, PLAN_CURRENCY, PLANS, planPrice, type PlanId } from '@/lib/plans'
import { addDaysISO, todayISO } from '@/lib/tz'
import { makeFormatters } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import type { ActionState } from '@/lib/types'

// ================================================================== time entries

export async function addTimeEntry(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const caseId = getStr(fd, 'case_id', 40)
  if (!isUuid(caseId)) return { error: t('doc.err.chooseCase') }
  const date = getDate(fd, 'entry_date') ?? todayISO()
  const hours = parseInt(getStr(fd, 'hours', 4) || '0', 10)
  const mins = parseInt(getStr(fd, 'mins', 4) || '0', 10)
  const minutes = (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(mins) ? mins : 0)
  if (minutes < 1 || minutes > 1440) return { error: t('lb.time.err.duration') }
  const description = getStr(fd, 'description', 500)
  if (!description) return { error: t('lb.time.err.description') }
  const rate = getMoneyCentsAllowZero(fd, 'rate')
  if (rate === null) return { error: t('lb.err.amount') }

  const sb = await createClient()
  const { error } = await sb.from('time_entries').insert({
    lawyer_id: me.firm_id, user_id: me.id, case_id: caseId, entry_date: date, minutes, description,
    billable: fd.get('billable') === 'on', rate_cents: rate,
  })
  if (error) return { error: dbError(error) }
  revalidatePath('/lawyer/time')
  return { success: t('lb.time.added') }
}

export async function deleteTimeEntry(fd: FormData) {
  await requireStaff()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const sb = await createClient()
  await sb.from('time_entries').delete().eq('id', id) // RLS: own entries (owner: all), never invoiced ones
  revalidatePath('/lawyer/time')
}

// Turns a case's unbilled time into a DRAFT invoice and marks those entries as invoiced.
export async function createInvoiceFromTime(fd: FormData) {
  const { t, f } = await getI18n()
  const me = await requireOwner()
  const ids = [...new Set(fd.getAll('entry').map(String).filter(isUuid))].slice(0, 300)
  const fail = (key: Parameters<typeof t>[0]) => redirect(`/lawyer/time?tab=unbilled&error=${encodeURIComponent(key)}`)
  if (ids.length === 0) return fail('lb.time.err.noneSelected')

  const sb = await createClient()
  const { data: entries } = await sb.from('time_entries')
    .select('id, case_id, entry_date, minutes, rate_cents, description, billable, invoiced_invoice_id').in('id', ids)
  const rows = (entries ?? []).filter((e) => e.billable && !e.invoiced_invoice_id)
  if (rows.length === 0 || new Set(rows.map((e) => e.case_id)).size !== 1) return fail('lb.time.err.oneCase')
  const caseId = rows[0].case_id as string

  const { data: c } = await sb.from('cases').select('id, client_id, case_number, title').eq('id', caseId).maybeSingle()
  if (!c) return fail('doc.err.notFound')

  const prefs = await loadFirmPrefs(sb, me.firm_id)
  const total = rows.reduce((s, e) => s + Math.round((e.minutes * Number(e.rate_cents)) / 60), 0)
  if (total <= 0) return fail('lb.time.err.noRate')

  rows.sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date)))
  const money = makeFormatters('en').money
  const lines = rows.map((e) =>
    `${e.entry_date}  ${e.description}  (${f.duration(e.minutes)} @ ${money(Number(e.rate_cents), prefs.default_currency)}/h)`)
  const description = `${t('lb.time.invoiceIntro', { case: `${c.case_number} · ${c.title}` })}\n${lines.join('\n')}`.slice(0, 2000)

  const { data: inv, error } = await sb.from('invoices').insert({
    lawyer_id: me.firm_id, client_id: c.client_id, case_id: caseId, number: '', description,
    amount_cents: total, currency: prefs.default_currency, status: 'draft',
    due_on: addDaysISO(todayISO(), prefs.default_due_days),
  }).select('id').single()
  if (error || !inv) return fail('lb.err.generic')

  const { data: marked } = await sb.from('time_entries').update({ invoiced_invoice_id: inv.id })
    .in('id', rows.map((e) => e.id)).is('invoiced_invoice_id', null).select('id')
  if ((marked?.length ?? 0) !== rows.length) {
    // someone invoiced some of them in the meantime: undo and tell the user
    await sb.from('time_entries').update({ invoiced_invoice_id: null }).eq('invoiced_invoice_id', inv.id)
    await sb.from('invoices').delete().eq('id', inv.id)
    return fail('lb.time.err.changed')
  }
  await audit(me.id, 'invoice.created_from_time', inv.id, { entries: rows.length })
  revalidatePath('/lawyer/time')
  revalidatePath('/lawyer/billing')
  redirect(`/lawyer/billing/${inv.id}`)
}

// ================================================================== invoices

function readInvoice(fd: FormData) {
  return {
    description: getStr(fd, 'description', 2000) || null,
    amount: getMoneyCents(fd, 'amount'),
    currency: getEnum(fd, 'currency', CURRENCIES, 'PKR'),
    due_on: getDate(fd, 'due_on'),
    issued_on: getDate(fd, 'issued_on') ?? todayISO(),
  }
}

export async function createInvoice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireOwner()
  const v = readInvoice(fd)
  if (v.amount === null) return { error: t('lb.err.amount') }

  const sb = await createClient()
  let clientId = getStr(fd, 'client_id', 40)
  const caseId = getStr(fd, 'case_id', 40)
  if (isUuid(caseId)) {
    const { data: c } = await sb.from('cases').select('client_id').eq('id', caseId).maybeSingle()
    if (!c) return { error: t('doc.err.notFound') }
    clientId = c.client_id // the case decides who is billed
  }
  if (!isUuid(clientId)) return { error: t('lb.bill.err.client') }

  const { data, error } = await sb.from('invoices').insert({
    lawyer_id: me.firm_id, client_id: clientId, case_id: isUuid(caseId) ? caseId : null, number: '',
    description: v.description, amount_cents: v.amount, currency: v.currency, issued_on: v.issued_on, due_on: v.due_on,
  }).select('id').single()
  if (error || !data) return { error: error ? dbError(error) : t('lb.err.generic') }
  await audit(me.id, 'invoice.created', data.id)
  revalidatePath('/lawyer/billing')
  redirect(`/lawyer/billing/${data.id}`)
}

export async function updateInvoice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  await requireOwner()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return { error: t('common.error.notFound') }
  const v = readInvoice(fd)
  if (v.amount === null) return { error: t('lb.err.amount') }
  const sb = await createClient()
  const { data, error } = await sb.from('invoices').update({
    description: v.description, amount_cents: v.amount, currency: v.currency, issued_on: v.issued_on, due_on: v.due_on,
  }).eq('id', id).eq('status', 'draft').select('id')
  if (error) return { error: dbError(error) }
  if (!data?.length) return { error: t('lb.bill.err.onlyDraft') }
  revalidatePath('/lawyer/billing')
  redirect(`/lawyer/billing/${id}`)
}

export async function setInvoiceStatus(fd: FormData) {
  const { t } = await getI18n()
  const me = await requireOwner()
  const id = getStr(fd, 'id', 40)
  const status = getEnum(fd, 'status', ['sent', 'paid', 'void'] as const, 'sent')
  if (!isUuid(id)) return
  const sb = await createClient()
  const { data } = await sb.from('invoices').update({ status }).eq('id', id).select('id, number, client_id, status').maybeSingle()
  if (!data) return
  if (status === 'void') await sb.from('time_entries').update({ invoiced_invoice_id: null }).eq('invoiced_invoice_id', id) // billable again
  await audit(me.id, `invoice.${status}`, id)
  if (status === 'sent') {
    await notify({
      toUserId: data.client_id,
      subject: t('lb.bill.mailSubject', { number: data.number }),
      heading: t('lb.bill.mailHeading'),
      body: t('lb.bill.mailBody', { number: data.number }),
      path: `/client/invoices/${id}`,
      button: t('lb.bill.mailButton'),
    })
  }
  revalidatePath('/lawyer/billing')
  revalidatePath(`/lawyer/billing/${id}`)
  revalidatePath('/client/invoices')
}

export async function deleteInvoice(fd: FormData) {
  const me = await requireOwner()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const sb = await createClient()
  await sb.from('time_entries').update({ invoiced_invoice_id: null }).eq('invoiced_invoice_id', id)
  const { data } = await sb.from('invoices').delete().eq('id', id).eq('status', 'draft').select('id')
  if (data?.length) await audit(me.id, 'invoice.deleted', id)
  revalidatePath('/lawyer/billing')
  redirect('/lawyer/billing')
}

// ================================================================== templates

export async function saveTemplate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const kind = getEnum(fd, 'kind', ['letter', 'invoice'] as const, 'letter')
  if (kind === 'invoice' && me.role !== 'lawyer') return { error: t('common.error.notAllowed') }
  const id = getStr(fd, 'id', 40)
  const name = getStr(fd, 'name', 120)
  const body = String(fd.get('body') ?? '').trim().slice(0, 20000)
  if (!name || !body) return { error: t('lb.tpl.err.required') }

  let amount: number | null = null
  if (kind === 'invoice' && getStr(fd, 'amount', 20)) {
    amount = getMoneyCents(fd, 'amount')
    if (amount === null) return { error: t('lb.err.amount') }
  }
  const row = {
    kind, name, body, amount_cents: amount,
    currency: kind === 'invoice' ? getEnum(fd, 'currency', CURRENCIES, 'PKR') : null,
  }
  const sb = await createClient()
  if (isUuid(id)) {
    const { error } = await sb.from('templates').update(row).eq('id', id)
    if (error) return { error: dbError(error) }
  } else {
    const { error } = await sb.from('templates').insert({ ...row, lawyer_id: me.firm_id, created_by: me.id })
    if (error) return { error: dbError(error) }
  }
  revalidatePath('/lawyer/templates')
  redirect(`/lawyer/templates${kind === 'invoice' ? '?tab=invoice' : ''}`)
}

export async function deleteTemplate(fd: FormData) {
  await requireStaff()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const sb = await createClient()
  await sb.from('templates').delete().eq('id', id)
  revalidatePath('/lawyer/templates')
}

// ================================================================== subscription payments (bank transfer)

const PROOF_TYPES: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

export type ProofPrep = { error?: string; path?: string; token?: string; contentType?: string }

// Step 1: permission + size + type check, then a one-time upload address. The file goes browser -> private storage.
export async function preparePaymentProof(input: { fileName: string; size: number }): Promise<ProofPrep> {
  const { t } = await getI18n()
  const me = await requireOwner({ allowLocked: true })
  const ext = (input.fileName.split('.').pop() ?? '').toLowerCase()
  if (!PROOF_FILES.includes(ext)) return { error: t('lb.sub.err.proofType') }
  if (!input.size || input.size > MAX_PROOF_BYTES) return { error: t('lb.sub.err.proofSize', { mb: Math.round(MAX_PROOF_BYTES / 1024 / 1024) }) }
  if (!(await allow(`proof:${me.id}`, 20, 3600))) return { error: t('common.error.tooMany') }

  const safe = input.fileName.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80)
  const path = `${me.id}/${crypto.randomUUID()}-${safe}`
  const { data, error } = await createAdminClient().storage.from(PROOF_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: t('doc.err.uploadFail') }
  return { path, token: data.token, contentType: PROOF_TYPES[ext] }
}

// Step 2: record the payment as PENDING. The amount is worked out here from the plan table, never taken from the browser.
export async function submitPayment(input: {
  plan: string; months: number; reference: string; paidOn: string; note: string; proofPath?: string
}): Promise<{ error?: string; success?: string }> {
  const { t } = await getI18n()
  const me = await requireOwner({ allowLocked: true })
  const plan = input.plan in PLANS ? (input.plan as PlanId) : null
  if (!plan || !MONTH_OPTIONS.includes(input.months)) return { error: t('lb.err.generic') }
  const reference = (input.reference ?? '').trim().slice(0, 120)
  if (!reference) return { error: t('lb.sub.err.reference') }
  const paidOn = /^\d{4}-\d{2}-\d{2}$/.test(input.paidOn) ? input.paidOn : todayISO()
  if (!(await allow(`payment:${me.id}`, 10, 86400))) return { error: t('common.error.tooMany') }

  const sb = await createClient()
  const { count } = await sb.from('payments').select('id', { count: 'exact', head: true }).eq('firm_id', me.id).eq('status', 'pending')
  if ((count ?? 0) >= 3) return { error: t('lb.sub.err.tooManyPending') }

  let proofPath: string | null = null
  if (input.proofPath) {
    const p = input.proofPath
    if (!p.startsWith(`${me.id}/`) || p.includes('..')) return { error: t('lb.err.generic') }
    const dir = p.slice(0, p.lastIndexOf('/'))
    const base = p.slice(p.lastIndexOf('/') + 1)
    const admin = createAdminClient()
    const { data: listed } = await admin.storage.from(PROOF_BUCKET).list(dir, { search: base, limit: 5 })
    const obj = listed?.find((o) => o.name === base)
    const size = Number((obj?.metadata as { size?: number } | undefined)?.size ?? 0)
    if (!obj || size <= 0 || size > MAX_PROOF_BYTES) {
      if (obj) await admin.storage.from(PROOF_BUCKET).remove([p])
      return { error: t('doc.err.uploadFail') }
    }
    proofPath = p
  }

  const amount = planPrice(plan, input.months) * 100
  const { data, error } = await sb.from('payments').insert({
    firm_id: me.id, plan, months: input.months, amount_cents: amount, currency: PLAN_CURRENCY, method: 'bank_transfer',
    reference, paid_on: paidOn, proof_path: proofPath, note: (input.note ?? '').trim().slice(0, 500) || null, status: 'pending',
  }).select('id').single()
  if (error || !data) {
    if (proofPath) await createAdminClient().storage.from(PROOF_BUCKET).remove([proofPath])
    return { error: error ? dbError(error) : t('lb.err.generic') }
  }

  await audit(me.id, 'payment.submitted', data.id, { plan, months: input.months })
  await notifyAdmins({
    subject: 'A bank transfer is waiting for confirmation',
    heading: 'Payment to confirm',
    body: `${me.firm_name ?? me.full_name ?? me.email} says they paid for the ${PLANS[plan].name} plan (${input.months} month(s)). Reference: ${reference}.`,
    path: '/admin/billing',
    button: 'Review payment',
  })
  revalidatePath('/lawyer/subscription')
  revalidatePath('/admin/billing')
  return { success: t('lb.sub.submitted') }
}


// Copies a built-in starter into the firm's own templates (to be edited afterwards)
export async function addStarter(fd: FormData) {
  const me = await requireStaff()
  const { STARTERS } = await import('@/lib/lawyer-b-templates')
  const starter = STARTERS.find((s) => s.id === getStr(fd, 'id', 60))
  if (!starter) return
  if (starter.kind === 'invoice' && me.role !== 'lawyer') return
  const sb = await createClient()
  await sb.from('templates').insert({
    lawyer_id: me.firm_id, kind: starter.kind, name: starter.name, body: starter.body,
    amount_cents: starter.amount_cents ?? null, currency: starter.kind === 'invoice' ? (starter.currency ?? 'PKR') : null, created_by: me.id,
  })
  revalidatePath('/lawyer/templates')
  redirect(`/lawyer/templates${starter.kind === 'invoice' ? '?tab=invoice' : ''}`)
}
