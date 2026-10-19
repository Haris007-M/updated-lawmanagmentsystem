'use server'

import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'
import { safeNext } from '@/lib/redirect'
import { allow, clientIp } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { buildSetupLink } from '@/lib/accounts'
import { mailConfigured, sendResetEmail } from '@/lib/mail'
import { validatePassword } from '@/lib/password'
import { getI18n } from '@/lib/i18n'
import { ROLE_HOME, type ActionState, type UserRole } from '@/lib/types'

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const fields = { email }
  if (!email || !password) return { error: t('auth.err.enterBoth'), fields }

  // Brute-force protection: per IP and per email.
  const ip = await clientIp()
  const okIp = await allow(`login:ip:${ip}`, 30, 900)
  const okEmail = await allow(`login:email:${email}`, 8, 900)
  if (!okIp || !okEmail) return { error: t('common.error.tooMany'), fields }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: t('auth.err.credentials'), fields }

  const { data } = await supabase.rpc('my_access').maybeSingle()
  const access = data as { my_role: UserRole; my_active: boolean; my_mfa_ok: boolean } | null

  if (!access) {
    await supabase.auth.signOut()
    return { error: t('auth.err.noprofile'), fields }
  }
  if (!access.my_active) {
    await supabase.auth.signOut()
    return { error: t('auth.err.inactive'), fields }
  }

  // Account has an authenticator app: ask for the 6-digit code before anything else.
  if (!access.my_mfa_ok) redirect('/login/verify')

  redirect(ROLE_HOME[access.my_role])
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: t('auth.err.enterBoth') }

  const ip = await clientIp()
  const okIp = await allow(`reset:ip:${ip}`, 10, 3600)
  const okEmail = await allow(`reset:email:${email}`, 3, 3600)
  if (!okIp || !okEmail) return { error: t('common.error.tooMany') }

  // Same message whether or not the email exists (prevents account enumeration)
  const generic: ActionState = { success: t('auth.resetSent') }

  if (mailConfigured()) {
    // Our own mailer: no dependence on Supabase's email limits or templates.
    const admin = createAdminClient()
    const { data: p } = await admin
      .from('profiles')
      .select('full_name, is_active')
      .eq('email', email)
      .maybeSingle()
    if (p?.is_active) {
      const { link } = await buildSetupLink(email)
      if (link) await sendResetEmail({ to: email, name: p.full_name ?? email, link })
    }
    return generic
  }

  // Fallback when SMTP is not configured: Supabase's built-in email.
  const supabase = await createClient()
  const site = await getSiteUrl()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/auth/set-password`,
  })
  return generic
}

const CONFIRM_TYPES = ['invite', 'recovery', 'email', 'magiclink']

// Runs when the user CLICKS the button on /auth/confirm. Verifying on click (not on
// page load) stops email/chat link scanners from burning the one-time token.
export async function confirmToken(formData: FormData) {
  const tokenHash = String(formData.get('token_hash') ?? '')
  const type = String(formData.get('type') ?? '')
  const next = safeNext(String(formData.get('next') ?? ''), '/auth/set-password')

  if (!tokenHash || !CONFIRM_TYPES.includes(type)) redirect('/login?error=invalid_link')

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  })
  if (error) redirect('/login?error=invalid_link')

  redirect(next)
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  const problem = validatePassword(password)
  if (problem) return { error: t(problem) }
  if (password !== confirm) return { error: t('auth.err.passwordMatch') }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: t('auth.err.expiredLink') }

  // first time in: the person must accept the Terms and Privacy Policy
  const admin = createAdminClient()
  const { data: prof } = await admin.from('profiles').select('terms_accepted_at').eq('id', user.id).maybeSingle()
  const needTerms = !prof?.terms_accepted_at
  if (needTerms && formData.get('terms') !== 'on') return { error: t('auth.mustAgree') }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  const now = new Date().toISOString()
  const { error: markError } = await admin
    .from('profiles')
    .update({ password_set_at: now, ...(needTerms ? { terms_accepted_at: now } : {}) })
    .eq('id', user.id)
  if (markError) console.error('Could not set password_set_at:', markError.message)

  await audit(user.id, 'password.set', user.id)

  // Sign out every other session of this user (old devices / anyone holding old tokens).
  await supabase.auth.signOut({ scope: 'others' })

  redirect('/') // the home page sends them to their role's dashboard
}
