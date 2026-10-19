import AuthCard from '@/components/AuthCard'
import ForgotPasswordForm from '@/components/ForgotPasswordForm'
import { getI18n } from '@/lib/i18n'

export default async function ForgotPasswordPage() {
  const { t } = await getI18n()
  return (
    <AuthCard title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
      <ForgotPasswordForm />
    </AuthCard>
  )
}
