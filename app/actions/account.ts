'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { getStr } from '@/lib/form'
import { validatePassword } from '@/lib/password'
import { getI18n } from '@/lib/i18n'
import { ROLE_HOME, type ActionState } from '@/lib/types'

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireUser({ allowLocked: true })
  const fullName = getStr(formData, 'full_name', 120)
  const phone = getStr(formData, 'phone', 40)
  if (!fullName) return { error: t('msg.profile.enterName') }

  // Only these columns can be changed, and only on your own row.
  const update: Record<string, string | boolean | null> = {
    full_name: fullName,
    phone: phone || null,
    notify_email: formData.get('notify_email') === 'on',
  }
  if (me.role === 'lawyer') update.firm_name = getStr(formData, 'firm_name', 160) || null

  const { error } = await createAdminClient().from('profiles').update(update).eq('id', me.id)
  if (error) {
    console.error('updateProfile failed:', error.message)
    return { error: t('msg.profile.saveFail') }
  }

  revalidatePath(ROLE_HOME[me.role], 'layout')
  return { success: t('msg.profile.saved') }
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireUser({ allowLocked: true })
  const current = String(formData.get('current') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!(await allow(`pwchange:${me.id}`, 5, 900))) return { error: t('common.error.tooMany') }
  if (!current) return { error: t('msg.pw.enterCurrent') }
  const problem = validatePassword(password)
  if (problem) return { error: t(problem) }
  if (password !== confirm) return { error: t('auth.err.passwordMatch') }
  if (password === current) return { error: t('msg.pw.same') }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: me.email, password: current })
  if (verifyError) return { error: t('msg.pw.wrongCurrent') }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  await supabase.auth.signOut({ scope: 'others' })
  await audit(me.id, 'password.changed', me.id)
  return { success: t('msg.pw.updated') }
}
