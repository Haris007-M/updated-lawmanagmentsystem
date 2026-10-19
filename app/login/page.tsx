import AuthCard from '@/components/AuthCard'
import LoginForm from '@/components/LoginForm'
import { BRAND } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import { redirectSignedIn } from '@/lib/home'

const ERRORS = ['inactive', 'noprofile', 'invalid_link', 'firm_locked'] as const

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await redirectSignedIn()
  const { error } = await searchParams
  const { t } = await getI18n()
  const known = ERRORS.find((e) => e === error)

  return (
    <AuthCard title={t('auth.signIn')} subtitle={t('auth.welcomeBack', { brand: BRAND.name })}>
      {known && (
        <p role="alert" className="mb-4 rounded-lg border border-alert-200 bg-alert-50 px-3.5 py-2.5 text-sm text-alert-700">
          {t(`auth.err.${known}` as const)}
        </p>
      )}
      <LoginForm />
    </AuthCard>
  )
}
