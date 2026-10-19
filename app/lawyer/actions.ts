'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOwner, requireStaff } from '@/lib/auth'
import { createAccount, createResultToState, readPerson, reissueInvite } from '@/lib/accounts'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { resetUserMfa } from '@/lib/mfa-admin'
import { getEnum, getStr, isUuid } from '@/lib/form'
import { audit } from '@/lib/audit'
import { limitError } from '@/lib/limits'
import { getI18n } from '@/lib/i18n'
import { CURRENCIES } from '@/lib/constants'
import type { ActionState } from '@/lib/types'

// ---------- Clients ----------
// The firm id comes from the verified session, never from the form.
export async function inviteClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()

  const person = await readPerson(formData)
  if (!person.ok) return { error: person.error, fields: person.fields }
  const phone = getStr(formData, 'phone', 40)
  const fields = { email: person.email, full_name: person.fullName, phone }

  if (!(await allow(`invite:${me.id}`, 30, 3600))) return { error: t('la.err.tooManyInvites'), fields }
  const limit = await limitError(me.firm_id, 'client')
  if (limit) return { error: t(limit), fields }

  const result = await createAccount({
    email: person.email,
    fullName: person.fullName,
    role: 'client',
    lawyerId: me.firm_id,
    invitedBy: me.full_name ?? me.email,
  })

  if (result.ok) {
    if (phone && result.userId) await createAdminClient().from('profiles').update({ phone }).eq('id', result.userId)
    await audit(me.id, 'client.created', result.userId, { email: person.email })
    revalidatePath('/lawyer', 'layout')
  }
  return createResultToState(result, person.email, fields, t('la.noun.client'))
}

export async function resendClientInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireStaff()
  const id = String(formData.get('id') ?? '')
  if (!(await allow(`invite:${me.id}`, 30, 3600))) return { error: t('common.error.tooMany') }

  const res = await reissueInvite(id, { role: 'client', lawyerId: me.firm_id }, me.full_name ?? me.email)
  if (res?.success || res?.link) await audit(me.id, 'invite.resent', id)
  return res
}

// Suspending a client is an owner decision.
export async function setClientActive(formData: FormData) {
  const me = await requireOwner()
  const id = String(formData.get('id') ?? '')
  const active = formData.get('active') === 'true'
  if (!isUuid(id)) return

  // .eq('lawyer_id', ...): a firm can only touch its OWN clients.
  const { data } = await createAdminClient()
    .from('profiles').update({ is_active: active })
    .eq('id', id).eq('role', 'client').eq('lawyer_id', me.firm_id).select('id')
  if (data?.length) await audit(me.id, active ? 'client.reactivated' : 'client.suspended', id)
  revalidatePath('/lawyer', 'layout')
}

// Lost phone: remove a client's authenticator (only for the firm's own clients).
export async function resetClientTwoFactor(formData: FormData) {
  const me = await requireOwner()
  const id = String(formData.get('id') ?? '')
  if (!isUuid(id)) return

  const { data: target } = await createAdminClient()
    .from('profiles').select('id').eq('id', id).eq('role', 'client').eq('lawyer_id', me.firm_id).maybeSingle()
  if (!target) return

  if (await resetUserMfa(id)) await audit(me.id, 'mfa.reset', id)
  revalidatePath('/lawyer', 'layout')
}

// ---------- First-run welcome ----------
export async function completeWelcome(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireOwner({ allowUnonboarded: true })

  const firmName = getStr(fd, 'firm_name', 160)
  const fields = {
    firm_name: firmName, phone: getStr(fd, 'phone', 40), address: getStr(fd, 'address', 400),
    currency: getStr(fd, 'currency', 3), hourly_rate: getStr(fd, 'hourly_rate', 12), due_days: getStr(fd, 'due_days', 3),
  }
  if (!firmName) return { error: t('la.welcome.err.firmName'), fields }

  const rateRaw = fields.hourly_rate.replace(/,/g, '')
  let rateCents = 0
  if (rateRaw) {
    if (!/^\d+(\.\d{1,2})?$/.test(rateRaw)) return { error: t('la.welcome.err.rate'), fields }
    rateCents = Math.round(parseFloat(rateRaw) * 100)
  }
  const dueDays = fields.due_days ? parseInt(fields.due_days, 10) : 14
  if (!Number.isFinite(dueDays) || dueDays < 0 || dueDays > 365) return { error: t('la.welcome.err.due'), fields }
  const currency = getEnum(fd, 'currency', CURRENCIES, 'PKR')

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const results = await Promise.all([
    admin.from('profiles').update({ firm_name: firmName, phone: fields.phone || null }).eq('id', me.id),
    admin.from('firm_settings').upsert({
      firm_id: me.id, firm_name: firmName, address: fields.address || null, phone: fields.phone || null, email: me.email,
    }, { onConflict: 'firm_id' }),
    admin.from('firm_prefs').upsert({
      firm_id: me.id, default_currency: currency, hourly_rate_cents: rateCents, default_due_days: dueDays, onboarded_at: now,
    }, { onConflict: 'firm_id' }),
  ])
  if (results.some((r) => r.error)) {
    console.error('welcome failed:', results.map((r) => r.error?.message).filter(Boolean).join('; '))
    return { error: t('common.error.generic'), fields }
  }
  await audit(me.id, 'firm.onboarded', me.id)
  revalidatePath('/lawyer', 'layout')
  redirect('/lawyer')
}
