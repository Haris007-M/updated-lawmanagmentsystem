import Link from 'next/link'
import StatusPage from '@/components/StatusPage'
import { getI18n } from '@/lib/i18n'
import { buttonCls, secondaryBtnCls } from '@/components/ui'

export default async function NotFound() {
  const { t } = await getI18n()
  return (
    <StatusPage code="404" title={t('status.404.title')} message={t('status.404.message')}>
      <Link href="/" className={buttonCls}>{t('status.404.cta')}</Link>
      <Link href="/login" className={secondaryBtnCls}>{t('auth.signIn')}</Link>
    </StatusPage>
  )
}
