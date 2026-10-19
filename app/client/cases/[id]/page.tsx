import { notFound } from 'next/navigation'
import Card from '@/components/Card'
import CaseMessages from '@/components/CaseMessages'
import DocumentList from '@/components/DocumentList'
import DocumentUploader from '@/components/DocumentUploader'
import PageHeader from '@/components/PageHeader'
import TabNav from '@/components/TabNav'
import { CaseStatusBadge } from '@/components/Badge'
import { requireRole } from '@/lib/auth'
import { nextHearings } from '@/lib/client-data'
import { getNames, nameOf } from '@/lib/data'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, DocumentRow, EventRow, InvoiceRow, MessageRow } from '@/lib/types'
import ClientEventList from '../../_components/ClientEventList'
import ClientInvoiceTable from '../../_components/ClientInvoiceTable'

const TAB_KEYS = ['overview', 'messages', 'documents', 'schedule', 'invoices'] as const

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="mt-0.5 text-slate-900">{children}</dd></div>
}

export default async function ClientCaseDetail({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireRole('client')
  const { id } = await params
  const { tab = 'overview' } = await searchParams
  if (!isUuid(id)) notFound()
  const { t, f } = await getI18n()

  const supabase = await createClient()
  const { data } = await supabase.from('cases').select('*').eq('id', id).eq('client_id', me.id).maybeSingle()
  if (!data) notFound()
  const c = data as CaseRow

  const active = (TAB_KEYS as readonly string[]).includes(tab) ? tab : 'overview'
  const tabs = TAB_KEYS.map((k) => ({ key: k, label: t(`cl.tab.${k}`) }))

  let body: React.ReactNode = null

  if (active === 'overview') {
    const [names, hearings] = await Promise.all([getNames(supabase, [c.lawyer_id]), nextHearings(supabase, [c.id])])
    const h = hearings[c.id]
    body = (
      <Card title={t('cl.detail.title')}>
        <dl className="grid gap-5 text-sm sm:grid-cols-3">
          <Item label={t('cl.detail.lawyer')}>{nameOf(names, c.lawyer_id, t('common.unknown'))}</Item>
          <Item label={t('cl.detail.type')}>{t(`caseType.${c.case_type}` as never)}</Item>
          <Item label={t('cl.detail.status')}><CaseStatusBadge status={c.status} /></Item>
          <Item label={t('cl.detail.court')}>{c.court || '—'}</Item>
          <Item label={t('cl.detail.courtNo')}><span dir="ltr">{c.court_case_number || '—'}</span></Item>
          <Item label={t('cl.detail.judge')}>{c.judge || '—'}</Item>
          <Item label={t('cl.detail.stage')}>{c.stage || '—'}</Item>
          <Item label={t('cl.detail.opposing')}>{c.opposing_party || '—'}</Item>
          <Item label={t('cl.detail.opened')}>{f.date(c.opened_on)}</Item>
          <Item label={t('cl.detail.nextHearing')}>{h ? `${f.dayLong(h.starts_at)} · ${f.time(h.starts_at)}` : '—'}</Item>
        </dl>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm font-medium text-slate-900">{t('cl.detail.summary')}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.description || t('cl.detail.noSummary')}</p>
        </div>
      </Card>
    )
  } else if (active === 'messages') {
    const { data: m } = await supabase.from('case_messages').select('id, case_id, author_id, body, created_at').eq('case_id', c.id).order('created_at', { ascending: true }).limit(300)
    const messages = (m ?? []) as MessageRow[]
    const names = await getNames(supabase, [me.id, ...messages.map((x) => x.author_id)])
    body = (
      <Card title={t('cl.convo')}>
        <CaseMessages caseId={c.id} meId={me.id} messages={messages} names={names} />
      </Card>
    )
  } else if (active === 'documents') {
    const { data: d } = await supabase.from('documents').select('*').eq('case_id', c.id).order('created_at', { ascending: false }).limit(300)
    const docs = (d ?? []) as DocumentRow[]
    const names = await getNames(supabase, docs.map((x) => x.uploaded_by))
    body = (
      <div className="space-y-6">
        <Card title={t('cl.sendDoc')}>
          <DocumentUploader caseId={c.id} canShare={false} />
        </Card>
        <Card title={t('cl.docsCount', { n: f.number(docs.filter((x) => x.is_current).length) })} padded={false}>
          <DocumentList docs={docs} names={names} role="client" meId={me.id} showCase={false} />
        </Card>
      </div>
    )
  } else if (active === 'schedule') {
    // row level security returns only the events the lawyer chose to share
    const { data: e } = await supabase
      .from('events')
      .select('id, lawyer_id, case_id, title, kind, starts_at, location, notes, outcome, visible_to_client, created_at')
      .eq('case_id', c.id).eq('visible_to_client', true).order('starts_at', { ascending: true }).limit(200)
    body = (
      <Card title={t('cl.schedule.title')} padded={false}>
        <ClientEventList events={(e ?? []) as EventRow[]} emptyTitle={t('cl.schedule.empty')} emptyHint={t('cl.schedule.emptyHint')} />
      </Card>
    )
  } else {
    const { data: i } = await supabase
      .from('invoices').select('id, lawyer_id, client_id, case_id, number, description, amount_cents, currency, status, issued_on, due_on, paid_on, created_at')
      .eq('case_id', c.id).eq('client_id', me.id).order('created_at', { ascending: false }).limit(100)
    body = (
      <Card title={t('cl.tab.invoices')} padded={false}>
        <ClientInvoiceTable invoices={(i ?? []) as InvoiceRow[]} />
      </Card>
    )
  }

  return (
    <>
      <PageHeader
        title={c.title}
        description={c.case_number}
        back={{ href: '/client/cases', label: t('cl.cases.title') }}
        actions={<CaseStatusBadge status={c.status} />}
      />
      <TabNav base={`/client/cases/${c.id}`} tabs={tabs} active={active} />
      <div className="mt-6">{body}</div>
    </>
  )
}
