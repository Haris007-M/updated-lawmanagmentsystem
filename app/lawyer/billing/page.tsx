import Link from 'next/link'
import { Plus } from 'lucide-react'
import Card from '@/components/Card'
import InvoiceTable from '@/components/InvoiceTable'
import LbFilterSelect from '@/components/LbFilterSelect'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import StatCard from '@/components/StatCard'
import { buttonCls, secondaryBtnCls } from '@/components/ui'
import { requireOwner } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { INVOICE_STATUSES } from '@/lib/constants'
import { formatTotals, sumByCurrency } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { TOTALS_LIMIT } from '@/lib/lawyer-b-form'
import { first, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow } from '@/lib/types'

const COLS = 'id, lawyer_id, client_id, case_id, number, description, amount_cents, currency, status, issued_on, due_on, paid_on, created_at'

export default async function BillingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireOwner()
  const sp = await searchParams
  const { t, f } = await getI18n()
  const paging = readPaging(sp)
  const status = (INVOICE_STATUSES as readonly string[]).includes(first(sp.status)) ? first(sp.status) : ''
  const sb = await createClient()

  // search also matches the client's name or email
  let clientIds: string[] = []
  if (paging.q) {
    const { data } = await sb.from('profiles').select('id').eq('role', 'client')
      .or(`full_name.ilike.%${paging.q}%,email.ilike.%${paging.q}%`).limit(60)
    clientIds = (data ?? []).map((p) => p.id)
  }

  let list = sb.from('invoices').select(COLS, { count: 'exact' }).order('created_at', { ascending: false }).range(paging.from, paging.to)
  if (status) list = list.eq('status', status)
  if (paging.q) {
    const parts = [`number.ilike.%${paging.q}%`, `description.ilike.%${paging.q}%`]
    if (clientIds.length) parts.push(`client_id.in.(${clientIds.join(',')})`)
    list = list.or(parts.join(','))
  }

  const [page, all] = await Promise.all([
    list,
    sb.from('invoices').select('status, amount_cents, currency').limit(TOTALS_LIMIT),
  ])
  const invoices = (page.data ?? []) as InvoiceRow[]
  const total = page.count ?? 0
  const sums = (s: string) => sumByCurrency((all.data ?? []).filter((r) => r.status === s) as { amount_cents: number; currency: string }[])
  const draftCount = (all.data ?? []).filter((r) => r.status === 'draft').length

  const names = await getNames(sb, invoices.map((i) => i.client_id))
  const caseIds = [...new Set(invoices.map((i) => i.case_id).filter((x): x is string => Boolean(x)))]
  const caseTitles: Record<string, string> = {}
  if (caseIds.length) {
    const { data } = await sb.from('cases').select('id, case_number, title').in('id', caseIds)
    for (const c of data ?? []) caseTitles[c.id] = `${c.case_number} · ${c.title}`
  }

  return (
    <>
      <PageHeader
        title={t('nav.billing')}
        description={t('lb.bill.subtitle')}
        actions={<>
          <Link href="/lawyer/time?tab=unbilled" className={secondaryBtnCls}>{t('lb.bill.fromTime')}</Link>
          <Link href="/lawyer/billing/new" className={buttonCls}><Plus className="h-4 w-4" aria-hidden />{t('lb.bill.new')}</Link>
        </>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label={t('lb.bill.outstanding')} value={formatTotals(sums('sent'), f.money)} tone="warn" hint={t('lb.bill.outstandingHint')} />
        <StatCard label={t('lb.bill.collected')} value={formatTotals(sums('paid'), f.money)} tone="good" />
        <StatCard label={t('lb.bill.drafts')} value={f.number(draftCount)} hint={t('lb.bill.draftsHint')} />
      </div>

      <ListToolbar basePath="/lawyer/billing" q={paging.q} placeholder={t('lb.bill.search')} active={Boolean(status)}>
        <LbFilterSelect name="status" value={status} label={t('common.status')}
          options={[{ value: '', label: t('list.allStatuses') }, ...INVOICE_STATUSES.map((s) => ({ value: s, label: t(`invoiceStatus.${s}`) }))]} />
      </ListToolbar>

      <Card padded={false}>
        <InvoiceTable invoices={invoices} names={names} caseTitles={caseTitles} role="lawyer" basePath="/lawyer/billing"
          emptyHint={paging.q || status ? t('list.noResultsHint') : undefined} />
        <Pagination total={total} page={paging.page} size={paging.size} basePath="/lawyer/billing" params={{ q: paging.q, status }} />
      </Card>
    </>
  )
}
