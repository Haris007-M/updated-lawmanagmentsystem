import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import TabNav from '@/components/TabNav'
import { CaseStatusBadge } from '@/components/Badge'
import { requireStaff } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow } from '@/lib/types'
import {
  BillingTab, DocumentsTab, MessagesTab, NotesTab, OverviewTab, ScheduleTab, TasksTab, TimeTab,
} from './tabs'

export default async function CaseDetailPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireStaff()
  const { id } = await params
  const { tab = 'overview' } = await searchParams
  if (!isUuid(id)) notFound()
  const { t } = await getI18n()

  const supabase = await createClient()
  const { data } = await supabase.from('cases').select('*').eq('id', id).eq('lawyer_id', me.firm_id).maybeSingle()
  if (!data) notFound()
  const c = data as CaseRow

  const names = await getNames(supabase, [c.client_id])
  const clientName = nameOf(names, c.client_id, t('common.unknown'))
  const owner = me.role === 'lawyer'
  const tabs = [
    { key: 'overview', label: t('la.tab.overview') },
    { key: 'messages', label: t('la.tab.messages') },
    { key: 'documents', label: t('nav.documents') },
    { key: 'tasks', label: t('nav.tasks') },
    { key: 'schedule', label: t('la.tab.schedule') },
    { key: 'notes', label: t('la.tab.notes') },
    { key: 'time', label: t('nav.time') },
    ...(owner ? [{ key: 'billing', label: t('nav.billing') }] : []),
  ]
  const active = tabs.some((x) => x.key === tab) ? tab : 'overview'
  const props = { c, me, clientName }

  return (
    <>
      <PageHeader
        title={c.title}
        description={`${c.case_number} · ${clientName}`}
        back={{ href: '/lawyer/cases', label: t('la.cases.all') }}
        actions={<CaseStatusBadge status={c.status} />}
      />
      <TabNav base={`/lawyer/cases/${c.id}`} tabs={tabs} active={active} />
      <div className="mt-6">
        {active === 'overview' && <OverviewTab {...props} />}
        {active === 'messages' && <MessagesTab {...props} />}
        {active === 'documents' && <DocumentsTab {...props} />}
        {active === 'tasks' && <TasksTab {...props} />}
        {active === 'schedule' && <ScheduleTab {...props} />}
        {active === 'notes' && <NotesTab {...props} />}
        {active === 'time' && <TimeTab {...props} />}
        {active === 'billing' && owner && <BillingTab {...props} />}
      </div>
    </>
  )
}
