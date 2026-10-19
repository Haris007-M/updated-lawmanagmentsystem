import { redirect } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import SetPasswordForm from '@/components/SetPasswordForm'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getI18n } from '@/lib/i18n'

// Reached from invite and password-reset emails (via /auth/confirm).
export default async function SetPasswordPage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=invalid_link')

  const { data: prof } = await createAdminClient().from('profiles').select('terms_accepted_at').eq('id', user.id).maybeSingle()

  return (
    <AuthCard title={t('auth.setTitle')} subtitle={user.email}>
      <SetPasswordForm needTerms={!prof?.terms_accepted_at} />
    </AuthCard>
  )
}
