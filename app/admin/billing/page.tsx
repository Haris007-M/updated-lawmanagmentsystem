import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import TabNav from '@/components/TabNav'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { inputCls, linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getNames, nameOf } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { getPlan } from '@/lib/plans'
import { first, ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import { PAYMENT_STATUSES } from '@/lib/admin-data'
import type { PaymentRow } from '@/lib/types'
import PayStatusBadge from '../_components/PayStatusBadge'
import PaymentActions from './PaymentActions'

const COLS = 'id, firm_id, plan, months, amount_cents, currency, reference, paid_on, proof_path, note, status, reviewed_by, reviewed_at, review_note, created_at'

export default async function BillingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole('super_admin')
  const { t, f } = await getI18n()
  const sp = await searchParams
  const tab = first(sp.tab) === 'history' ? 'history' : 'pending'
  const status = (PAYMENT_STATUSES as readonly string[]).includes(first(sp.status)) ? first(sp.status) : ''
  const pg = readPaging(sp)
  const firmId = isUuid(first(sp.firm)) ? first(sp.firm) : ''
  const supabase = await createClient()

  let pending: PaymentRow[] = []
  let history: PaymentRow[] = []
  let total = 0
  let pendingCount = 0

  if (tab === 'pending') {
    const { data, count } = await supabase.from('payments').select(COLS, { count: 'exact' }).eq('status', 'pending').order('created_at').limit(50)
    pending = (data ?? []) as PaymentRow[]
    pendingCount = count ?? pending.length
  } else {
    let q = supabase.from('payments').select(COLS, { count: 'exact' }).order('created_at', { ascending: false }).range(pg.from, pg.to)
    if (status) q = q.eq('status', status)
    if (firmId) q = q.eq('firm_id', firmId)
    if (pg.q) q = q.or(ilikeOr(['reference', 'note'], pg.q))
    const [{ data, count }, c] = await Promise.all([
      q,
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    history = (data ?? []) as PaymentRow[]
    total = count ?? 0
    pendingCount = c.count ?? 0
  }

  const rows = tab === 'pending' ? pending : history
  const names = await getNames(supabase, rows.flatMap((p) => [p.firm_id, p.reviewed_by]))

  return (
    <>
      <PageHeader title={t('nav.adminBilling')} description={t('adm.pay.desc')} />
      <div className="mb-6">
        <TabNav
          base="/admin/billing"
          active={tab}
          tabs={[
            { key: 'pending', label: t('adm.pay.tabPending'), count: pendingCount },
            { key: 'history', label: t('adm.pay.tabHistory') },
          ]}
        />
      </div>

      {tab === 'pending' ? (
        pending.length === 0 ? (
          <Card><EmptyState kind="invoices" title={t('adm.pay.noPending')} hint={t('adm.pay.noPendingHint')} /></Card>
        ) : (
          <ul className="space-y-4">
            {pending.map((p) => {
              const firm = nameOf(names, p.firm_id, t('common.unknown'))
              const summary = `${firm} · ${f.money(p.amount_cents, p.currency)}`
              return (
                <li key={p.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link href={`/admin/lawyers/${p.firm_id}`} className="text-base font-semibold text-slate-900 hover:underline">{firm}</Link>
                        <p className="mt-0.5 text-sm text-slate-600">{getPlan(p.plan).name} · {t('adm.months', { n: p.months })}</p>
                      </div>
                      <p className="font-display text-2xl font-semibold text-brand-900" dir="ltr">{f.money(p.amount_cents, p.currency)}</p>
                    </div>
                    <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                      <div><dt className="text-xs text-slate-500">{t('adm.pay.reference')}</dt><dd className="text-slate-900" dir="ltr">{p.reference ?? '—'}</dd></div>
                      <div><dt className="text-xs text-slate-500">{t('adm.pay.paidOn')}</dt><dd className="text-slate-900">{p.paid_on ? f.date(p.paid_on) : '—'}</dd></div>
                      <div><dt className="text-xs text-slate-500">{t('adm.pay.submitted')}</dt><dd className="text-slate-900">{f.dateTime(p.created_at)}</dd></div>
                      <div>
                        <dt className="text-xs text-slate-500">{t('adm.pay.proof')}</dt>
                        <dd>{p.proof_path ? <a href={`/api/payments/${p.id}/proof`} target="_blank" rel="noopener noreferrer" className={linkCls}>{t('adm.pay.openProof')}</a> : <span className="text-alert-700">{t('adm.pay.noProof')}</span>}</dd>
                      </div>
                    </dl>
                    {p.note && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{p.note}</p>}
                    <div className="mt-5 border-t border-slate-100 pt-4"><PaymentActions id={p.id} summary={summary} /></div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )
      ) : (
        <>
          <ListToolbar basePath="/admin/billing" q={pg.q} placeholder={t('adm.pay.searchPlaceholder')} active={Boolean(status)}>
            <input type="hidden" name="tab" value="history" />
            {firmId && <input type="hidden" name="firm" value={firmId} />}
            <select name="status" defaultValue={status} aria-label={t('common.status')} className={`${inputCls} w-auto`}>
              <option value="">{t('list.allStatuses')}</option>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{t(`adm.pay.status.${s}` as const)}</option>)}
            </select>
          </ListToolbar>
          <Card padded={false}>
            {history.length === 0 ? (
              <EmptyState kind="search" title={t('list.noResults')} hint={t('list.noResultsHint')} />
            ) : (
              <>
                <Table>
                  <THead>
                    <Th>{t('common.date')}</Th><Th>{t('adm.firms.firm')}</Th><Th>{t('adm.firms.plan')}</Th><Th>{t('common.amount')}</Th>
                    <Th>{t('adm.pay.reference')}</Th><Th>{t('common.status')}</Th><Th>{t('adm.pay.reviewedBy')}</Th>
                  </THead>
                  <TBody>
                    {history.map((p) => (
                      <Tr key={p.id}>
                        <Td label={t('common.date')} className="whitespace-nowrap">{f.date(p.created_at)}</Td>
                        <Td label={t('adm.firms.firm')}><Link href={`/admin/lawyers/${p.firm_id}`} className={linkCls}>{nameOf(names, p.firm_id, t('common.unknown'))}</Link></Td>
                        <Td label={t('adm.firms.plan')}>{getPlan(p.plan).name} · {t('adm.months', { n: p.months })}</Td>
                        <Td label={t('common.amount')} className="whitespace-nowrap"><span dir="ltr">{f.money(p.amount_cents, p.currency)}</span></Td>
                        <Td label={t('adm.pay.reference')}>
                          <span dir="ltr">{p.reference ?? '—'}</span>
                          {p.proof_path && <> · <a href={`/api/payments/${p.id}/proof`} target="_blank" rel="noopener noreferrer" className={linkCls}>{t('adm.pay.proof')}</a></>}
                          {p.review_note && <p className="text-xs text-slate-500">{p.review_note}</p>}
                        </Td>
                        <Td label={t('common.status')}><PayStatusBadge status={p.status} /></Td>
                        <Td label={t('adm.pay.reviewedBy')}>{p.reviewed_by ? <>{nameOf(names, p.reviewed_by)}<p className="text-xs text-slate-500">{f.date(p.reviewed_at)}</p></> : '—'}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
                <Pagination total={total} page={pg.page} size={pg.size} basePath="/admin/billing" params={{ tab: 'history', q: pg.q, status, firm: firmId }} />
              </>
            )}
          </Card>
        </>
      )}
    </>
  )
}
