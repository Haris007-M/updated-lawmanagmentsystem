'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createAccount, createResultToState, readPerson, reissueInvite } from '@/lib/accounts'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { resetUserMfa } from '@/lib/mfa-admin'
import { dbError, getStr, isUuid } from '@/lib/form'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { getI18n } from '@/lib/i18n'
import { PLAN_ORDER } from '@/lib/plans'
import { EXTEND_MONTHS, LEAD_STATUSES, MANUAL_STATUSES, dayEndUtc } from '@/lib/admin-data'
import type { ActionState } from '@/lib/types'

function refreshFirm(id?: string) {
  revalidatePath('/admin', 'layout')
  if (id) revalidatePath(`/admin/lawyers/${id}`)
}

// ---------------------------------------------------------------- firms

export async function inviteLawyer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')

  const person = await readPerson(formData)
  if (!person.ok) return { error: person.error, fields: person.fields }
  const firmName = getStr(formData, 'firm_name', 160)
  const fields = { email: person.email, full_name: person.fullName, firm_name: firmName }

  if (!(await allow(`invite:${me.id}`, 30, 3600))) return { error: t('adm.err.tooManyInvites'), fields }

  const result = await createAccount({
    email: person.email,
    fullName: person.fullName,
    role: 'lawyer',
    invitedBy: me.full_name ?? t('adm.administrator'),
  })

  if (result.ok) {
    if (result.userId && firmName) {
      const admin = createAdminClient()
      await admin.from('profiles').update({ firm_name: firmName }).eq('id', result.userId)
      await admin.from('firm_settings').update({ firm_name: firmName }).eq('firm_id', result.userId)
    }
    await audit(me.id, 'lawyer.created', result.userId, { email: person.email })
    revalidatePath('/admin', 'layout')
  }
  return createResultToState(result, person.email, fields, t('role.lawyer'))
}

export async function resendLawyerInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')
  const id = String(formData.get('id') ?? '')
  if (!(await allow(`invite:${me.id}`, 30, 3600))) return { error: t('common.error.tooMany') }

  const res = await reissueInvite(id, { role: 'lawyer' }, me.full_name ?? t('adm.administrator'))
  if (res?.success || res?.link) await audit(me.id, 'invite.resent', id)
  return res
}

// Suspends or reactivates the ACCOUNT (the lawyer, juniors and clients can no longer sign in). Separate from billing.
export async function setLawyerActive(formData: FormData) {
  const me = await requireRole('super_admin')
  const id = String(formData.get('id') ?? '')
  const active = formData.get('active') === 'true'
  if (!isUuid(id)) return

  const { data } = await createAdminClient()
    .from('profiles')
    .update({ is_active: active })
    .eq('id', id)
    .eq('role', 'lawyer')
    .select('id')
  if (data?.length) await audit(me.id, active ? 'lawyer.reactivated' : 'lawyer.suspended', id)
  refreshFirm(id)
}

// Lost phone: remove a lawyer's authenticator so they can sign in with the password and set it up again.
export async function resetLawyerTwoFactor(formData: FormData) {
  const me = await requireRole('super_admin')
  const id = String(formData.get('id') ?? '')
  if (!isUuid(id)) return
  const { data: target } = await createAdminClient().from('profiles').select('id').eq('id', id).eq('role', 'lawyer').maybeSingle()
  if (!target) return
  if (await resetUserMfa(id)) await audit(me.id, 'mfa.reset', id)
  refreshFirm(id)
}

// ---------------------------------------------------------------- subscriptions

async function firmExists(id: string): Promise<boolean> {
  if (!isUuid(id)) return false
  const { data } = await createAdminClient().from('profiles').select('id').eq('id', id).eq('role', 'lawyer').maybeSingle()
  return Boolean(data)
}

type SubRow = { status: string; trial_ends_at: string | null; current_period_end: string | null; plan: string }

async function readSub(firmId: string): Promise<SubRow | null> {
  const { data } = await createAdminClient()
    .from('subscriptions')
    .select('status, trial_ends_at, current_period_end, plan')
    .eq('firm_id', firmId)
    .maybeSingle()
  return data as SubRow | null
}

// Full manual edit of one firm's subscription.
export async function updateSubscription(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')
  const firmId = getStr(fd, 'firm_id', 40)
  if (!(await firmExists(firmId))) return { error: t('adm.err.firmNotFound') }

  const plan = getStr(fd, 'plan', 30)
  const status = getStr(fd, 'status', 20)
  if (!(PLAN_ORDER as readonly string[]).includes(plan)) return { error: t('common.error.generic') }
  if (!(MANUAL_STATUSES as readonly string[]).includes(status)) return { error: t('common.error.generic') }

  const graceRaw = parseInt(getStr(fd, 'grace_days', 3), 10)
  if (!Number.isInteger(graceRaw) || graceRaw < 0 || graceRaw > 60) return { error: t('adm.err.graceRange') }

  const periodEnd = getStr(fd, 'period_end', 10)
  const trialEnd = getStr(fd, 'trial_end', 10)
  const periodIso = periodEnd ? dayEndUtc(periodEnd) : null
  const trialIso = trialEnd ? dayEndUtc(trialEnd) : null
  if ((periodEnd && !periodIso) || (trialEnd && !trialIso)) return { error: t('adm.err.badDate') }

  const { error } = await createAdminClient().from('subscriptions').upsert({
    firm_id: firmId,
    plan,
    status,
    current_period_end: periodIso,
    trial_ends_at: trialIso,
    grace_days: graceRaw,
    notes: getStr(fd, 'notes', 1000) || null,
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: dbError(error) }

  await audit(me.id, 'subscription.updated', firmId, { plan, status, period_end: periodIso, trial_end: trialIso })
  refreshFirm(firmId)
  return { success: t('adm.sub.saved') }
}

// Adds paid months (a manual payment, a goodwill extension...). Time is added on top of what is left.
export async function extendSubscription(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')
  const firmId = getStr(fd, 'firm_id', 40)
  const months = parseInt(getStr(fd, 'months', 3), 10)
  if (!(await firmExists(firmId))) return { error: t('adm.err.firmNotFound') }
  if (!(EXTEND_MONTHS as readonly number[]).includes(months)) return { error: t('common.error.generic') }

  const sub = await readSub(firmId)
  const now = new Date()
  let base = now
  if (sub?.status === 'active' && sub.current_period_end && new Date(sub.current_period_end) > now) base = new Date(sub.current_period_end)
  const end = new Date(base)
  end.setUTCMonth(end.getUTCMonth() + months)

  const { error } = await createAdminClient().from('subscriptions').upsert({
    firm_id: firmId, status: 'active', current_period_end: end.toISOString(), updated_at: now.toISOString(),
    ...(sub ? {} : { plan: 'starter' }),
  })
  if (error) return { error: dbError(error) }

  await audit(me.id, 'subscription.extended', firmId, { months })
  refreshFirm(firmId)
  return { success: t('adm.sub.extended', { months }) }
}

// Gives (more) free-trial days.
export async function grantTrial(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')
  const firmId = getStr(fd, 'firm_id', 40)
  const days = parseInt(getStr(fd, 'days', 3), 10)
  if (!(await firmExists(firmId))) return { error: t('adm.err.firmNotFound') }
  if (!Number.isInteger(days) || days < 1 || days > 90) return { error: t('adm.err.daysRange') }

  const sub = await readSub(firmId)
  const now = new Date()
  const base = sub?.trial_ends_at && new Date(sub.trial_ends_at) > now ? new Date(sub.trial_ends_at) : now
  const end = new Date(base.getTime() + days * 86_400_000)

  const { error } = await createAdminClient().from('subscriptions').upsert({
    firm_id: firmId, status: 'trial', trial_ends_at: end.toISOString(), updated_at: now.toISOString(),
    ...(sub ? {} : { plan: 'starter' }),
  })
  if (error) return { error: dbError(error) }

  await audit(me.id, 'subscription.trial_granted', firmId, { days })
  refreshFirm(firmId)
  return { success: t('adm.sub.trialGranted', { days }) }
}

// One-click status change: suspend (locks the workspace), cancel, or re-open.
export async function setSubscriptionStatus(formData: FormData) {
  const me = await requireRole('super_admin')
  const firmId = getStr(formData, 'firm_id', 40)
  const status = getStr(formData, 'status', 20)
  if (!(await firmExists(firmId))) return
  if (!['suspended', 'canceled', 'active'].includes(status)) return

  const sub = await readSub(firmId)
  const patch: Record<string, string | null> = { firm_id: firmId, status, updated_at: new Date().toISOString() }
  // re-opening a lapsed firm needs a future end date, otherwise it would lock again at once
  if (status === 'active') {
    const end = sub?.current_period_end ? new Date(sub.current_period_end) : null
    if (!end || end <= new Date()) patch.current_period_end = new Date(Date.now() + 7 * 86_400_000).toISOString()
  }
  const { error } = await createAdminClient().from('subscriptions').upsert({ ...patch, ...(sub ? {} : { plan: 'starter' }) })
  if (error) { console.error('setSubscriptionStatus failed:', error.message); return }

  await audit(me.id, `subscription.${status}`, firmId)
  refreshFirm(firmId)
}

// ---------------------------------------------------------------- payments (bank transfers)

async function notifyFirm(firmId: string, kind: 'confirmed' | 'rejected', note?: string) {
  await notify({
    toUserId: firmId,
    subject: kind === 'confirmed' ? 'Your payment was confirmed' : 'Your payment could not be confirmed',
    heading: kind === 'confirmed' ? 'Payment confirmed' : 'Payment not confirmed',
    body: kind === 'confirmed'
      ? 'Thank you. We received your bank transfer and your subscription is now active.'
      : `We could not confirm your bank transfer.${note ? `\n\nReason: ${note}` : ''}\n\nPlease sign in to check the details and try again.`,
    path: '/lawyer/subscription',
    button: 'Open subscription',
  })
}

export async function confirmPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return { error: t('adm.err.paymentNotFound') }

  const admin = createAdminClient()
  const { data: pay } = await admin.from('payments').select('id, firm_id, plan, months, amount_cents').eq('id', id).maybeSingle()
  if (!pay) return { error: t('adm.err.paymentNotFound') }

  // the database function adds the paid months to the subscription and marks the payment confirmed, atomically
  const { error } = await admin.rpc('confirm_payment', { p_payment: id, p_reviewer: me.id })
  if (error) return { error: error.message.length < 120 ? error.message : t('common.error.generic') }

  await audit(me.id, 'payment.confirmed', pay.firm_id, { payment: id, plan: pay.plan, months: pay.months, amount_cents: pay.amount_cents })
  await notifyFirm(pay.firm_id, 'confirmed')
  revalidatePath('/admin', 'layout')
  return { success: t('adm.pay.confirmedMsg') }
}

export async function rejectPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')
  const id = getStr(fd, 'id', 40)
  const reason = getStr(fd, 'reason', 500)
  if (!isUuid(id)) return { error: t('adm.err.paymentNotFound') }
  if (!reason) return { error: t('adm.err.reasonNeeded') }

  const { data } = await createAdminClient()
    .from('payments')
    .update({ status: 'rejected', reviewed_by: me.id, reviewed_at: new Date().toISOString(), review_note: reason })
    .eq('id', id)
    .eq('status', 'pending')
    .select('firm_id')
    .maybeSingle()
  if (!data) return { error: t('adm.err.paymentNotFound') }

  await audit(me.id, 'payment.rejected', data.firm_id, { payment: id, reason })
  await notifyFirm(data.firm_id, 'rejected', reason)
  revalidatePath('/admin', 'layout')
  return { success: t('adm.pay.rejectedMsg') }
}

// ---------------------------------------------------------------- leads

export async function setLeadStatus(formData: FormData) {
  const me = await requireRole('super_admin')
  const id = getStr(formData, 'id', 40)
  const status = getStr(formData, 'status', 20)
  if (!isUuid(id) || !(LEAD_STATUSES as readonly string[]).includes(status)) return
  const { data } = await createAdminClient().from('leads').update({ status }).eq('id', id).select('id').maybeSingle()
  if (data) await audit(me.id, 'lead.status', id, { status })
  revalidatePath('/admin', 'layout')
}

export async function deleteLead(formData: FormData) {
  const me = await requireRole('super_admin')
  const id = getStr(formData, 'id', 40)
  if (!isUuid(id)) return
  const { data } = await createAdminClient().from('leads').delete().eq('id', id).select('id').maybeSingle()
  if (data) await audit(me.id, 'lead.deleted', id)
  revalidatePath('/admin', 'layout')
}

// ---------------------------------------------------------------- platform settings

export async function savePlatformSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireRole('super_admin')

  const trial = parseInt(getStr(fd, 'trial_days', 3), 10)
  const grace = parseInt(getStr(fd, 'grace_days', 3), 10)
  if (!Number.isInteger(trial) || trial < 0 || trial > 90) return { error: t('adm.err.daysRange') }
  if (!Number.isInteger(grace) || grace < 0 || grace > 60) return { error: t('adm.err.graceRange') }

  const { error } = await createAdminClient().from('platform_settings').upsert({
    id: 1,
    bank_name: getStr(fd, 'bank_name', 120) || null,
    account_title: getStr(fd, 'account_title', 120) || null,
    account_number: getStr(fd, 'account_number', 60) || null,
    iban: getStr(fd, 'iban', 60) || null,
    branch: getStr(fd, 'branch', 120) || null,
    payment_instructions: getStr(fd, 'payment_instructions', 1500) || null,
    support_whatsapp: getStr(fd, 'support_whatsapp', 30) || null,
    support_email: getStr(fd, 'support_email', 120) || null,
    trial_days: trial,
    grace_days: grace,
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: dbError(error) }

  await audit(me.id, 'platform.settings_saved', null)
  revalidatePath('/', 'layout')
  return { success: t('adm.settings.saved') }
}
