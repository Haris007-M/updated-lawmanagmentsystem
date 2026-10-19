'use server'

import { revalidatePath } from 'next/cache'
import { requireOwner } from '@/lib/auth'
import { createAccount, createResultToState, readPerson, reissueInvite } from '@/lib/accounts'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { resetUserMfa } from '@/lib/mfa-admin'
import { audit } from '@/lib/audit'
import { getEnum, getStr, isUuid } from '@/lib/form'
import { dbError } from '@/lib/form'
import { limitError } from '@/lib/limits'
import { getMoneyCentsAllowZero } from '@/lib/lawyer-b-form'
import { CURRENCIES } from '@/lib/constants'
import { getI18n } from '@/lib/i18n'
import type { ActionState } from '@/lib/types'

// ---------------------------------------------------------------- juniors (firm staff)

export async function inviteJunior(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const owner = await requireOwner() // the firm id comes from the verified session, never from the form
  const person = await readPerson(fd)
  if (!person.ok) return { error: person.error, fields: person.fields }
  const fields = { email: person.email, full_name: person.fullName }

  if (!(await allow(`invite:${owner.id}`, 30, 3600))) return { error: t('lb.team.err.tooMany'), fields }
  const limit = await limitError(owner.firm_id, 'junior')
  if (limit) return { error: t(limit), fields }

  const result = await createAccount({
    email: person.email, fullName: person.fullName, role: 'junior', lawyerId: owner.firm_id,
    invitedBy: owner.full_name ?? owner.email,
  })
  if (result.ok) {
    await audit(owner.id, 'junior.created', result.userId, { email: person.email })
    revalidatePath('/lawyer/team')
  }
  return createResultToState(result, person.email, fields, t('role.junior'))
}

export async function resendJuniorInvite(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const owner = await requireOwner()
  if (!(await allow(`invite:${owner.id}`, 30, 3600))) return { error: t('lb.team.err.tooMany') }
  const res = await reissueInvite(getStr(fd, 'id', 40), { role: 'junior', lawyerId: owner.firm_id }, owner.full_name ?? owner.email)
  if (res?.success || res?.link) await audit(owner.id, 'invite.resent', getStr(fd, 'id', 40))
  return res
}

export async function setJuniorActive(fd: FormData) {
  const owner = await requireOwner()
  const id = getStr(fd, 'id', 40)
  const active = fd.get('active') === 'true'
  if (!isUuid(id)) return
  // .eq('lawyer_id'): only the owner's OWN juniors can be touched
  const { data } = await createAdminClient().from('profiles').update({ is_active: active })
    .eq('id', id).eq('role', 'junior').eq('lawyer_id', owner.firm_id).select('id')
  if (data?.length) await audit(owner.id, active ? 'junior.reactivated' : 'junior.suspended', id)
  revalidatePath('/lawyer/team')
}

export async function resetJuniorTwoFactor(fd: FormData) {
  const owner = await requireOwner()
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const { data: target } = await createAdminClient().from('profiles').select('id')
    .eq('id', id).eq('role', 'junior').eq('lawyer_id', owner.firm_id).maybeSingle()
  if (!target) return
  if (await resetUserMfa(id)) await audit(owner.id, 'mfa.reset', id)
  revalidatePath('/lawyer/team')
}

// ---------------------------------------------------------------- firm profile, letterhead and defaults

export async function updateFirmSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const owner = await requireOwner()
  const firmName = getStr(fd, 'firm_name', 160)
  const row = {
    firm_name: firmName || null,
    address: getStr(fd, 'address', 400) || null,
    phone: getStr(fd, 'phone', 60) || null,
    email: getStr(fd, 'email', 160) || null,
    ntn: getStr(fd, 'ntn', 60) || null,
    bank_details: String(fd.get('bank_details') ?? '').trim().slice(0, 1000) || null,
    invoice_terms: String(fd.get('invoice_terms') ?? '').trim().slice(0, 1000) || null,
    letter_footer: String(fd.get('letter_footer') ?? '').trim().slice(0, 500) || null,
    updated_at: new Date().toISOString(),
  }
  const sb = await createClient()
  const { error } = await sb.from('firm_settings').upsert({ firm_id: owner.firm_id, ...row })
  if (error) return { error: dbError(error) }
  if (firmName) await createAdminClient().from('profiles').update({ firm_name: firmName }).eq('id', owner.id) // keep the profile in step
  await audit(owner.id, 'firm.settings_updated', owner.firm_id)
  revalidatePath('/lawyer', 'layout')
  return { success: t('lb.set.saved') }
}

export async function updateFirmPrefs(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const owner = await requireOwner()
  const rate = getMoneyCentsAllowZero(fd, 'hourly_rate')
  if (rate === null) return { error: t('lb.err.amount') }
  const due = parseInt(getStr(fd, 'default_due_days', 4) || '14', 10)
  if (!Number.isFinite(due) || due < 0 || due > 365) return { error: t('lb.set.err.due') }
  const sb = await createClient()
  const { error } = await sb.from('firm_prefs').upsert({
    firm_id: owner.firm_id, hourly_rate_cents: rate, default_currency: getEnum(fd, 'default_currency', CURRENCIES, 'PKR'),
    default_due_days: due, updated_at: new Date().toISOString(),
  })
  if (error) return { error: dbError(error) }
  revalidatePath('/lawyer', 'layout')
  return { success: t('lb.set.saved') }
}
