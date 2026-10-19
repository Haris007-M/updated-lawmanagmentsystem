import PageHeader from '@/components/PageHeader'
import SettingsPanel from '@/components/SettingsPanel'
import { requireRole } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'

export default async function ClientSettingsPage() {
  const me = await requireRole('client')
  const { t } = await getI18n()
  return (
    <>
      <PageHeader title={t('cl.settings.title')} description={t('cl.settings.desc')} />
      <SettingsPanel profile={me} />
    </>
  )
}
