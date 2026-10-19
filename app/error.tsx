'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import StatusPage from '@/components/StatusPage'
import { useI18n } from '@/components/I18nProvider'
import { buttonCls, secondaryBtnCls } from '@/components/ui'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n()
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage code="500" title={t('status.500.title')} message={t('status.500.message')}>
      <button type="button" onClick={reset} className={buttonCls}>{t('status.500.retry')}</button>
      <Link href="/" className={secondaryBtnCls}>{t('status.500.home')}</Link>
      {error.digest && <p className="w-full text-xs text-slate-400">{t('status.500.ref', { ref: error.digest })}</p>}
    </StatusPage>
  )
}
