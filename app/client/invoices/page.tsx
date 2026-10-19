import Card from '@/components/Card'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import StatCard from '@/components/StatCard'
import { requireRole } from '@/lib/auth'
import { formatTotals, sumByCurrency } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { readPaging, type SearchParams } from '@/lib/paging'
import { cumulativeWeekly, weekly } from '@/lib/series'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow } from '@/lib/types'
import ClientInvoiceTable from '../_components/ClientInvoiceTable'

const COLS = 'id, lawyer_id, client_id, case_id, number, description, amount_cents, currency, status, issued_on, due_on, paid_on, created_at'

export default async function ClientInvoicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireRole('client')
  const { t, f } = await getI18n()
  const p = readPaging(await searchParams)
  const supabase = await createClient()

  let q = supabase.from('invoices').select(COLS, { count: 'exact' }).eq('client_id', me.id)
  if (p.q) q = q.ilike('number', `%${p.q}%`)
  const [listRes, sumRes] = await Promise.all([
    q.order('created_at', { ascending: false }).range(p.from, p.to),
    // totals ignore the search and the page
    supabase.from('invoices').select('amount_cents, currency, status, issued_on, paid_on').eq('client_id', me.id).in('status', ['sent', 'paid']).limit(1000),
  ])
  const invoices = (listRes.data ?? []) as InvoiceRow[]
  const all = (sumRes.data ?? []) as Pick<InvoiceRow, 'amount_cents' | 'currency' | 'status' | 'issued_on' | 'paid_on'>[]
  const due = all.filter((i) => i.status === 'sent')
  const paid = all.filter((i) => i.status === 'paid')

  return (
    <>
      <PageHeader title={t('cl.inv.title')} description={t('cl.inv.desc')} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          label={t('cl.stat.balance')} value={formatTotals(sumByCurrency(due), f.money)} hint={t('cl.stat.invoices', { n: f.number(due.length) })}
          tone={due.length ? 'warn' : 'default'} series={weekly(due.map((i) => i.issued_on))} caption={t('cl.cap.invoices')}
        />
        <StatCard
          label={t('cl.stat.paid')} value={formatTotals(sumByCurrency(paid), f.money)} tone="good"
          series={cumulativeWeekly(paid.map((i) => i.paid_on))} caption={t('cl.cap.running')}
        />
      </div>
      <div className="mt-6">
        <ListToolbar basePath="/client/invoices" q={p.q} placeholder={t('cl.inv.search')} />
        <Card padded={false}>
          <ClientInvoiceTable invoices={invoices} />
          <Pagination total={listRes.count ?? 0} page={p.page} size={p.size} basePath="/client/invoices" params={{ q: p.q }} />
        </Card>
      </div>
    </>
  )
}
