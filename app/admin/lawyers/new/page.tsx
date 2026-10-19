import PageHeader from '@/components/PageHeader'
import { requireRole } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { first, type SearchParams } from '@/lib/paging'
import NewFirmForm from './NewFirmForm'

// Creates the lawyer account (the firm owner). A free trial starts automatically.
// Optional ?name=&email=&firm= pre-fills the form (used by "Create firm" on a lead).
export default async function NewFirmPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole('super_admin')
  const { t } = await getI18n()
  const sp = await searchParams
  const defaults = {
    name: first(sp.name).slice(0, 120),
    email: first(sp.email).slice(0, 254),
    firm: first(sp.firm).slice(0, 160),
  }

  return (
    <>
      <PageHeader title={t('adm.firms.new')} description={t('adm.new.desc')} back={{ href: '/admin/lawyers', label: t('nav.firms') }} />
      <div className="max-w-3xl">
        <NewFirmForm key={`${defaults.name}|${defaults.email}|${defaults.firm}`} defaults={defaults} />
        <p className="mt-3 text-xs text-slate-500">{t('adm.new.note')}</p>
      </div>
    </>
  )
}
