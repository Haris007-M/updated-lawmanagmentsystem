import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusPage from '@/components/StatusPage'
import { logout } from '@/app/actions/auth'
import { getContext } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { ROLE_HOME } from '@/lib/types'
import { buttonCls, secondaryBtnCls } from '@/components/ui'

// Shown to a firm's juniors and clients while the firm's subscription is not active.
export default async function LockedPage() {
  const me = await getContext()
  if (!me) redirect('/login')
  if (me.billing !== 'locked') redirect(ROLE_HOME[me.role])
  const { t } = await getI18n()
  return (
    <StatusPage code="" title={t('status.locked.title')} message={t('status.locked.message')}>
      {me.role === 'lawyer' && <Link href="/lawyer/subscription" className={buttonCls}>{t('status.locked.owner')}</Link>}
      <form action={logout}><button type="submit" className={secondaryBtnCls}>{t('shell.signOut')}</button></form>
    </StatusPage>
  )
}
