import Card from '@/components/Card'
import LbTemplateForm from '@/components/LbTemplateForm'
import PageHeader from '@/components/PageHeader'
import { requireStaff } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { first, type SearchParams } from '@/lib/paging'

export default async function NewTemplatePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t } = await getI18n()
  const kind = me.role === 'lawyer' && first(sp.kind) === 'invoice' ? 'invoice' : 'letter'
  return (
    <>
      <PageHeader title={t('lb.tpl.new')} back={{ href: `/lawyer/templates${kind === 'invoice' ? '?tab=invoice' : ''}`, label: t('nav.templates') }} />
      <Card><LbTemplateForm kind={kind} /></Card>
    </>
  )
}
