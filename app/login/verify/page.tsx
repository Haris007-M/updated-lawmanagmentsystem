import { redirect } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import MfaLoginForm from '@/components/MfaLoginForm'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n'

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const { t } = await getI18n()
  const supabase = await createClient()
  const { data } = await supabase.rpc('my_access').maybeSingle()
  const access = data as { my_mfa_ok: boolean } | null
  if (!access) redirect('/login')
  if (access.my_mfa_ok) redirect('/') // nothing to verify

  return (
    <AuthCard title={t('auth.mfaTitle')} subtitle={t('auth.mfaSubtitle')}>
      <MfaLoginForm next={next === '/auth/set-password' ? next : undefined} />
    </AuthCard>
  )
}
