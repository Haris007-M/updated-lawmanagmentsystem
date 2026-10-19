import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { addTimeEntry, createInvoiceFromTime, deleteTimeEntry } from '@/app/lawyer/billing-actions'
import ActionForm from '@/components/ActionForm'
import { Badge } from '@/components/Badge'
import Card from '@/components/Card'
import ConfirmButton from '@/components/ConfirmButton'
import EmptyState from '@/components/EmptyState'
import { Checkbox, Field, Select, TextArea } from '@/components/Field'
import LbDateFilter from '@/components/LbDateFilter'
import LbFilterSelect from '@/components/LbFilterSelect'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import StatCard from '@/components/StatCard'
import TabNav from '@/components/TabNav'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { buttonCls, dangerLinkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { centsToInput } from '@/lib/format'
import { isUuid } from '@/lib/form'
import { dateParam, TOTALS_LIMIT } from '@/lib/lawyer-b-form'
import { loadCaseOptions, loadFirmPrefs } from '@/lib/lawyer-b-data'
import { first, ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { todayISO } from '@/lib/tz'
import { createClient } from '@/lib/supabase/server'
import type { TKey } from '@/lib/i18n/shared'

const COLS = 'id, user_id, case_id, entry_date, minutes, description, billable, rate_cents, invoiced_invoice_id'
type Entry = {
  id: string; user_id: string; case_id: string; entry_date: string; minutes: number; description: string
  billable: boolean; rate_cents: number; invoiced_invoice_id: string | null
}

export default async function TimePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const owner = me.role === 'lawyer'
  const sp = await searchParams
  const { t, f } = await getI18n()
  const tab = owner && first(sp.tab) === 'unbilled' ? 'unbilled' : 'entries'
  const sb = await createClient()

  const [prefs, cases] = await Promise.all([loadFirmPrefs(sb, me.firm_id), loadCaseOptions(sb)])
  const caseMap = new Map(cases.map((c) => [c.id, c]))
  const cur = prefs.default_currency

  const addCard = (
    <Card title={t('lb.time.add')} className="mb-6">
      {cases.length === 0 ? (
        <p className="text-sm text-slate-600">{t('lb.time.noCases')}</p>
      ) : (
        <ActionForm action={addTimeEntry} submitLabel={t('lb.time.addBtn')} resetOnSuccess>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Select label={t('common.case')} name="case_id" required emptyLabel={t('doc.chooseCasePlaceholder')}
                options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
            </div>
            <Field label={t('common.date')} name="entry_date" type="date" required defaultValue={todayISO()} dir="ltr" />
            <Field label={t('lb.time.rate', { cur })} name="rate" defaultValue={prefs.hourly_rate_cents ? centsToInput(prefs.hourly_rate_cents) : ''} placeholder="0" dir="ltr" hint={t('lb.time.rateHint')} />
            <Field label={t('lb.time.hours')} name="hours" type="number" min={0} max={24} defaultValue={0} dir="ltr" />
            <Field label={t('lb.time.minutes')} name="mins" type="number" min={0} max={59} defaultValue={30} dir="ltr" />
          </div>
          <TextArea label={t('common.description')} name="description" rows={2} required maxLength={500} placeholder={t('lb.time.descPlaceholder')} />
          <Checkbox name="billable" label={t('lb.time.billable')} defaultChecked />
        </ActionForm>
      )}
    </Card>
  )

  const tabs = owner
    ? <div className="mb-5"><TabNav base="/lawyer/time" active={tab} tabs={[{ key: 'entries', label: t('lb.time.tabEntries') }, { key: 'unbilled', label: t('lb.time.tabUnbilled') }]} /></div>
    : null

  // ------------------------------------------------------------ unbilled time -> invoice (owner)
  if (tab === 'unbilled') {
    const { data } = await sb.from('time_entries').select(COLS).eq('billable', true).is('invoiced_invoice_id', null)
      .order('entry_date', { ascending: true }).limit(500)
    const rows = (data ?? []) as Entry[]
    const names = await getNames(sb, rows.map((r) => r.user_id))
    const byCase = new Map<string, Entry[]>()
    for (const r of rows) byCase.set(r.case_id, [...(byCase.get(r.case_id) ?? []), r])
    const errKey = first(sp.error)
    const err = errKey && errKey.startsWith('lb.') ? t(errKey as TKey) : errKey ? t(errKey as TKey) : ''

    return (
      <>
        <PageHeader title={t('nav.time')} description={t('lb.time.unbilledHint')} />
        {tabs}
        {err && <p role="alert" className="mb-4 rounded-lg border border-alert-200 bg-alert-50 px-3.5 py-2.5 text-sm text-alert-700">{err}</p>}
        {byCase.size === 0 ? (
          <Card><EmptyState kind="time" title={t('lb.time.noUnbilled')} hint={t('lb.time.noUnbilledHint')} /></Card>
        ) : (
          <div className="space-y-5">
            {[...byCase.entries()].map(([cid, list]) => {
              const c = caseMap.get(cid)
              const value = list.reduce((s, e) => s + Math.round((e.minutes * e.rate_cents) / 60), 0)
              const mins = list.reduce((s, e) => s + e.minutes, 0)
              return (
                <form key={cid} action={createInvoiceFromTime}>
                  <Card
                    title={c ? `${c.case_number} · ${c.title}` : t('common.case')}
                    action={<span className="text-sm font-semibold text-brand-900">{f.money(value, cur)} · {f.duration(mins)}</span>}
                    padded={false}
                  >
                    <Table>
                      <THead><Th>{t('lb.time.include')}</Th><Th>{t('common.date')}</Th><Th>{t('common.description')}</Th><Th>{t('lb.time.person')}</Th><Th>{t('lb.time.duration')}</Th><Th>{t('common.amount')}</Th></THead>
                      <TBody>
                        {list.map((e) => (
                          <Tr key={e.id}>
                            <Td label={t('lb.time.include')}>
                              <input type="checkbox" name="entry" value={e.id} defaultChecked aria-label={e.description} className="h-4 w-4 rounded border-slate-300 accent-gold-600" />
                            </Td>
                            <Td label={t('common.date')}>{f.date(e.entry_date)}</Td>
                            <Td label={t('common.description')}>{e.description}</Td>
                            <Td label={t('lb.time.person')}>{names[e.user_id]?.full_name ?? names[e.user_id]?.email ?? '—'}</Td>
                            <Td label={t('lb.time.duration')}>{f.duration(e.minutes)}</Td>
                            <Td label={t('common.amount')}>{f.money(Math.round((e.minutes * e.rate_cents) / 60), cur)}</Td>
                          </Tr>
                        ))}
                      </TBody>
                    </Table>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
                      <p className="text-xs text-slate-500">{t('lb.time.invoiceNote')}</p>
                      <button type="submit" className={buttonCls}>{t('lb.time.createInvoice')}</button>
                    </div>
                  </Card>
                </form>
              )
            })}
          </div>
        )}
      </>
    )
  }

  // ------------------------------------------------------------ entries list
  const paging = readPaging(sp)
  const caseFilter = isUuid(first(sp.case)) ? first(sp.case) : ''
  const billable = ['yes', 'no'].includes(first(sp.billable)) ? first(sp.billable) : ''
  const invoiced = ['yes', 'no'].includes(first(sp.invoiced)) ? first(sp.invoiced) : ''
  const from = dateParam(first(sp.from))
  const to = dateParam(first(sp.to))
  const person = owner && isUuid(first(sp.user)) ? first(sp.user) : ''

  const apply = <T extends { eq: (c: string, v: unknown) => T; is: (c: string, v: null) => T; not: (c: string, o: string, v: null) => T; gte: (c: string, v: string) => T; lte: (c: string, v: string) => T; or: (f: string) => T }>(q: T): T => {
    if (paging.q) q = q.or(ilikeOr(['description'], paging.q))
    if (caseFilter) q = q.eq('case_id', caseFilter)
    if (billable) q = q.eq('billable', billable === 'yes')
    if (invoiced === 'yes') q = q.not('invoiced_invoice_id', 'is', null)
    if (invoiced === 'no') q = q.is('invoiced_invoice_id', null)
    if (from) q = q.gte('entry_date', from)
    if (to) q = q.lte('entry_date', to)
    if (person) q = q.eq('user_id', person)
    return q
  }

  const [page, totalsRes, staff] = await Promise.all([
    apply(sb.from('time_entries').select(COLS, { count: 'exact' }).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).range(paging.from, paging.to)),
    apply(sb.from('time_entries').select('minutes, rate_cents, billable').limit(TOTALS_LIMIT)),
    owner ? sb.from('profiles').select('id, full_name, email').in('role', ['lawyer', 'junior']).order('full_name') : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
  ])
  const rows = (page.data ?? []) as Entry[]
  const total = page.count ?? 0
  const names = await getNames(sb, rows.map((r) => r.user_id))
  const tr = (totalsRes.data ?? []) as { minutes: number; rate_cents: number; billable: boolean }[]
  const allMin = tr.reduce((s, e) => s + e.minutes, 0)
  const billMin = tr.filter((e) => e.billable).reduce((s, e) => s + e.minutes, 0)
  const value = tr.filter((e) => e.billable).reduce((s, e) => s + Math.round((e.minutes * e.rate_cents) / 60), 0)
  const filtered = Boolean(caseFilter || billable || invoiced || from || to || person)

  return (
    <>
      <PageHeader title={t('nav.time')} description={owner ? t('lb.time.subtitleOwner') : t('lb.time.subtitleJunior')} />
      {tabs}
      {addCard}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label={t('lb.time.totalTime')} value={f.duration(allMin)} hint={t('lb.time.entriesCount', { n: f.number(total) })} />
        <StatCard label={t('lb.time.billableTime')} value={f.duration(billMin)} tone="good" />
        <StatCard label={t('lb.time.billableValue')} value={f.money(value, cur)} tone="warn" />
      </div>

      <ListToolbar basePath="/lawyer/time" q={paging.q} placeholder={t('lb.time.search')} active={filtered}>
        <LbFilterSelect name="case" value={caseFilter} label={t('common.case')}
          options={[{ value: '', label: t('lb.docs.allCases') }, ...cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))]} />
        <LbFilterSelect name="billable" value={billable} label={t('lb.time.billableFilter')}
          options={[{ value: '', label: t('lb.time.anyBillable') }, { value: 'yes', label: t('lb.time.billableOnly') }, { value: 'no', label: t('lb.time.nonBillableOnly') }]} />
        <LbFilterSelect name="invoiced" value={invoiced} label={t('lb.time.invoicedFilter')}
          options={[{ value: '', label: t('lb.time.anyInvoiced') }, { value: 'yes', label: t('lb.time.invoicedOnly') }, { value: 'no', label: t('lb.time.notInvoiced') }]} />
        {owner && (
          <LbFilterSelect name="user" value={person} label={t('lb.time.person')}
            options={[{ value: '', label: t('lb.time.everyone') }, ...(staff.data ?? []).map((s) => ({ value: s.id, label: s.full_name || s.email }))]} />
        )}
        <LbDateFilter from={from} to={to} fromLabel={t('lb.time.from')} toLabel={t('lb.time.to')} />
      </ListToolbar>

      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState kind="time" title={filtered || paging.q ? t('list.noResults') : t('lb.time.none')} hint={filtered || paging.q ? t('list.noResultsHint') : t('lb.time.noneHint')} />
        ) : (
          <Table>
            <THead>
              <Th>{t('common.date')}</Th><Th>{t('common.case')}</Th><Th>{t('common.description')}</Th>
              {owner && <Th>{t('lb.time.person')}</Th>}
              <Th>{t('lb.time.duration')}</Th><Th>{t('common.amount')}</Th><Th>{t('common.status')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th>
            </THead>
            <TBody>
              {rows.map((e) => {
                const c = caseMap.get(e.case_id)
                return (
                  <Tr key={e.id}>
                    <Td label={t('common.date')}>{f.date(e.entry_date)}</Td>
                    <Td label={t('common.case')}>{c ? <Link href={`/lawyer/cases/${c.id}?tab=time`} className="font-medium text-brand-800 hover:underline">{c.case_number}</Link> : '—'}</Td>
                    <Td label={t('common.description')}><span className="whitespace-pre-wrap break-words">{e.description}</span></Td>
                    {owner && <Td label={t('lb.time.person')}>{names[e.user_id]?.full_name ?? names[e.user_id]?.email ?? '—'}</Td>}
                    <Td label={t('lb.time.duration')}>{f.duration(e.minutes)}</Td>
                    <Td label={t('common.amount')}>{e.billable ? f.money(Math.round((e.minutes * e.rate_cents) / 60), cur) : '—'}</Td>
                    <Td label={t('common.status')}>
                      <span className="inline-flex flex-wrap gap-1.5">
                        {e.billable ? <Badge tone="green">{t('lb.time.billableBadge')}</Badge> : <Badge>{t('lb.time.nonBillableBadge')}</Badge>}
                        {e.invoiced_invoice_id && owner && <Link href={`/lawyer/billing/${e.invoiced_invoice_id}`}><Badge tone="blue">{t('lb.time.invoicedBadge')}</Badge></Link>}
                        {e.invoiced_invoice_id && !owner && <Badge tone="blue">{t('lb.time.invoicedBadge')}</Badge>}
                      </span>
                    </Td>
                    <Td label="">
                      {!e.invoiced_invoice_id && (
                        <form action={deleteTimeEntry}>
                          <input type="hidden" name="id" value={e.id} />
                          <ConfirmButton message={t('lb.time.confirmDelete')} className={dangerLinkCls} ariaLabel={t('common.delete')}>
                            <Trash2 className="inline h-4 w-4" aria-hidden /> <span className="sm:sr-only">{t('common.delete')}</span>
                          </ConfirmButton>
                        </form>
                      )}
                    </Td>
                  </Tr>
                )
              })}
            </TBody>
          </Table>
        )}
        <Pagination total={total} page={paging.page} size={paging.size} basePath="/lawyer/time"
          params={{ q: paging.q, case: caseFilter, billable, invoiced, from, to, user: person }} />
      </Card>
    </>
  )
}
