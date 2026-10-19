import { redirect } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import { confirmToken } from '@/app/actions/auth'
import { buttonCls } from '@/components/ui'
import { BRAND } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'

// Landing page for invite / setup / reset links that carry a token_hash.
// The token is only verified when the person clicks the button (email scanners cannot burn it).
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>
}) {
  const { token_hash, type, next } = await searchParams
  if (!token_hash || !type) redirect('/login?error=invalid_link')
  const { t } = await getI18n()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AuthCard title={t('auth.welcomeTo', { brand: BRAND.name })} subtitle={t('auth.continueSubtitle')}>
      {user && (
        <p role="alert" className="mb-4 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-gold-800">
          {t('auth.switchWarning', { email: user.email ?? '' })}
        </p>
      )}
      <form action={confirmToken}>
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next ?? '/auth/set-password'} />
        <button type="submit" className={`${buttonCls} w-full`}>{t('common.continue')}</button>
      </form>
    </AuthCard>
  )
}
