import { notFound } from 'next/navigation'
import Card from '@/components/Card'
import LbTemplateForm from '@/components/LbTemplateForm'
import PageHeader from '@/components/PageHeader'
import { requireStaff } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import type { TemplateRow } from '@/lib/types'

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff()
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { t } = await getI18n()
  const sb = await createClient()
  const { data } = await sb.from('templates').select('id, lawyer_id, kind, name, body, amount_cents, currency, created_at, updated_at').eq('id', id).maybeSingle()
  if (!data || (data.kind === 'invoice' && me.role !== 'lawyer')) notFound()
  const tpl = data as TemplateRow
  return (
    <>
      <PageHeader title={tpl.name} back={{ href: `/lawyer/templates${tpl.kind === 'invoice' ? '?tab=invoice' : ''}`, label: t('nav.templates') }} />
      <Card><LbTemplateForm kind={tpl.kind} template={tpl} /></Card>
    </>
  )
}
