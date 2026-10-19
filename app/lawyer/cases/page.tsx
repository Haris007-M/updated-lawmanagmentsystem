import Link from 'next/link'
import { Plus } from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { CaseStatusBadge } from '@/components/Badge'
import { Table, TBody, Td, THead, Th, Tr } from '@/components/Table'
import { buttonCls, inputCls, linkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { CASE_STATUSES } from '@/lib/constants'
import { getNames, nameOf } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { nextHearingByCase } from '@/lib/lawyer-a-data'
import { first, ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow } from '@/lib/types'

export default async function CasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t, f } = await getI18n()
  const paging = readPaging(sp)
  const status = CASE_STATUSES.find((s) => s === first(sp.status)) ?? ''
  const supabase = await createClient()

  let query = supabase
    .from('cases')
    .select('id, case_number, title, status, court, court_case_number, stage, client_id, updated_at', { count: 'exact' })
    .eq('lawyer_id', me.firm_id)
  if (status) query = query.eq('status', status)
  if (paging.q) query = query.or(ilikeOr(['title', 'case_number', 'court_case_number', 'opposing_party', 'court'], paging.q))
  const { data, count } = await query.order('updated_at', { ascending: false }).range(paging.from, paging.to)
  const cases = (data ?? []) as Pick<CaseRow, 'id' | 'case_number' | 'title' | 'status' | 'court' | 'court_case_number' | 'stage' | 'client_id' | 'updated_at'>[]

  const [names, hearings] = await Promise.all([
    getNames(supabase, cases.map((c) => c.client_id)),
    nextHearingByCase(supabase, me.firm_id, cases.map((c) => c.id)),
  ])
  const total = count ?? 0

  return (
    <>
      <PageHeader
        title={t('nav.cases')}
        description={t('la.cases.intro')}
        actions={<Link href="/lawyer/cases/new" className={buttonCls}><Plus className="h-4 w-4" aria-hidden />{t('la.cases.new')}</Link>}
      />
      <ListToolbar basePath="/lawyer/cases" q={paging.q} placeholder={t('la.cases.searchPlaceholder')} active={Boolean(status)}>
        <select name="status" defaultValue={status} aria-label={t('common.status')} className={`${inputCls} !w-auto`}>
          <option value="">{t('list.allStatuses')}</option>
          {CASE_STATUSES.map((s) => <option key={s} value={s}>{t(`caseStatus.${s}`)}</option>)}
        </select>
      </ListToolbar>

      <Card padded={false}>
        {cases.length === 0 ? (
          paging.q || status
            ? <EmptyState kind="search" title={t('list.noResults')} hint={t('list.noResultsHint')} />
            : <EmptyState kind="cases" title={t('la.cases.none')} hint={t('la.cases.noneHint')} action={<Link href="/lawyer/cases/new" className={buttonCls}>{t('la.cases.new')}</Link>} />
        ) : (
          <Table>
            <THead>
              <Th>{t('common.case')}</Th><Th>{t('common.client')}</Th><Th>{t('la.cases.courtStage')}</Th><Th>{t('la.cases.nextHearing')}</Th><Th>{t('common.status')}</Th>
            </THead>
            <TBody>
              {cases.map((c) => (
                <Tr key={c.id} className="align-top">
                  <Td label={t('common.case')}>
                    <Link href={`/lawyer/cases/${c.id}`} className={`${linkCls} break-words`}>{c.title}</Link>
                    <p className="text-xs text-slate-500">{c.case_number}{c.court_case_number ? ` · ${c.court_case_number}` : ''}</p>
                  </Td>
                  <Td label={t('common.client')}>{nameOf(names, c.client_id, t('common.unknown'))}</Td>
                  <Td label={t('la.cases.courtStage')}>
                    {c.court || '—'}
                    {c.stage && <p className="text-xs text-slate-500">{c.stage}</p>}
                  </Td>
                  <Td label={t('la.cases.nextHearing')}>{hearings[c.id] ? <>{f.date(hearings[c.id])}<p className="text-xs text-slate-500">{f.time(hearings[c.id])}</p></> : '—'}</Td>
                  <Td label={t('common.status')}><CaseStatusBadge status={c.status} /></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination total={total} page={paging.page} size={paging.size} basePath="/lawyer/cases" params={{ q: paging.q, status }} />
      </Card>
    </>
  )
}
