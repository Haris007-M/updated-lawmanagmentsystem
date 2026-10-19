import type { TKey } from '@/lib/i18n/shared'

// Server-side password policy (Supabase's own minimum is only 6). Returns a translation key, or null if fine.
export function validatePassword(pw: string): TKey | null {
  if (pw.length < 10) return 'auth.err.passwordShort'
  if (pw.length > 72) return 'auth.err.passwordLong'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'auth.err.passwordMix'
  return null
}
