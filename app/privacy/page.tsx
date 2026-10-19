import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { getI18n } from '@/lib/i18n'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t('site.meta.privacy'), alternates: { canonical: '/privacy' } }
}

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />
}
