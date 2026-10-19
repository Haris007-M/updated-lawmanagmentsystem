'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { getStr, isUuid } from '@/lib/form'
import { safeNext } from '@/lib/redirect'
import { BRAND } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import { ROLE_HOME, type ActionState } from '@/lib/types'

const cleanCode = (fd: FormData) => getStr(fd, 'code', 12).replace(/\s/g, '')

export type EnrollStart = { error?: string; factorId?: string; qr?: string; secret?: string }

// Step 1 of turning 2FA on: create a pending authenticator factor and return its QR code.
export async function beginMfaEnroll(): Promise<EnrollStart> {
  const { t } = await getI18n()
  const me = await requireUser({ allowLocked: true })
  if (!(await allow(`mfa-enroll:${me.id}`, 10, 3600))) return { error: t('common.error.tooMany') }

  const supabase = await createClient()
  const { data: list } = await supabase.auth.mfa.listFactors()
  if ((list?.totp ?? []).length > 0) return { error: t('msg.mfa.already') }

  // clear half-finished set-ups so the new one never collides with them
  for (const f of list?.all ?? []) {
    if (f.factor_type === 'totp' && f.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `${BRAND.name} ${crypto.randomUUID().slice(0, 8)}`,
  })
  if (error || !data) return { error: error?.message ?? t('msg.mfa.startFail') }
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
}

// Step 2: the person types the first code from their app to prove it works.
export async function confirmMfaEnroll(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireUser({ allowLocked: true })
  const factorId = getStr(fd, 'factor_id', 60)
  const code = cleanCode(fd)
  if (!isUuid(factorId)) return { error: t('msg.mfa.restart') }
  if (!/^\d{6}$/.test(code)) return { error: t('msg.mfa.enterCode') }
  if (!(await allow(`mfa:${me.id}`, 8, 900))) return { error: t('common.error.tooMany') }

  const supabase = await createClient()
  const { data: ch, error: chError } = await supabase.auth.mfa.challenge({ factorId })
  if (chError || !ch) return { error: chError?.message ?? t('msg.mfa.verifyFail') }

  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code })
  if (error) return { error: t('msg.mfa.badCode') }

  await createAdminClient().from('profiles').update({ mfa_enabled: true }).eq('id', me.id)
  await audit(me.id, 'mfa.enabled', me.id)
  revalidatePath(ROLE_HOME[me.role], 'layout')
  return { success: t('msg.mfa.on') }
}

// Turning it off needs a valid code too, so a borrowed, unlocked laptop cannot disable it.
export async function disableMfa(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireUser({ allowLocked: true })
  const code = cleanCode(fd)
  if (!/^\d{6}$/.test(code)) return { error: t('msg.mfa.enterCode') }
  if (!(await allow(`mfa:${me.id}`, 8, 900))) return { error: t('common.error.tooMany') }

  const supabase = await createClient()
  const { data: list } = await supabase.auth.mfa.listFactors()
  const factor = list?.totp?.[0]
  if (!factor) return { error: t('msg.mfa.notOn') }

  const { data: ch, error: chError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
  if (chError || !ch) return { error: chError?.message ?? t('msg.mfa.verifyFail') }
  const { error: vError } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code })
  if (vError) return { error: t('msg.mfa.badCode') }

  const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
  if (error) return { error: error.message }

  await createAdminClient().from('profiles').update({ mfa_enabled: false }).eq('id', me.id)
  await audit(me.id, 'mfa.disabled', me.id)
  revalidatePath(ROLE_HOME[me.role], 'layout')
  return { success: t('msg.mfa.off') }
}

// Used on /login/verify right after the password step.
export async function verifyLoginMfa(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = cleanCode(fd)
  if (!/^\d{6}$/.test(code)) return { error: t('msg.mfa.enterCode') }
  if (!(await allow(`mfa:${user.id}`, 8, 900))) return { error: t('common.error.tooMany') }

  const { data: list } = await supabase.auth.mfa.listFactors()
  const factor = list?.totp?.[0]
  if (!factor) redirect('/')

  const { data: ch, error: chError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
  if (chError || !ch) return { error: t('msg.mfa.verifyFail') }

  const { error } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code })
  if (error) return { error: t('msg.mfa.badCode') }

  redirect(safeNext(getStr(fd, 'next', 100), '/')) // '/' sends them to their dashboard
}
