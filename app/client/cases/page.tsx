import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { CaseStatusBadge } from '@/components/Badge'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { nextHearings } from '@/lib/client-data'
import { getI18n } from '@/lib/i18n'
import { ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow } from '@/lib/types'

export default async function ClientCasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireRole('client')
  const { t, f } = await getI18n()
  const p = readPaging(await searchParams)
  const supabase = await createClient()

  let query = supabase
    .from('cases')
    .select('id, case_number, title, case_type, status, opened_on', { count: 'exact' })
    .eq('client_id', me.id)
  if (p.q) query = query.or(ilikeOr(['title', 'case_number'], p.q))
  const { data, count } = await query.order('updated_at', { ascending: false }).range(p.from, p.to)
  const cases = (data ?? []) as CaseRow[]
  const hearings = await nextHearings(supabase, cases.map((c) => c.id))

  return (
    <>
      <PageHeader title={t('cl.cases.title')} description={t('cl.cases.desc')} />
      <ListToolbar basePath="/client/cases" q={p.q} placeholder={t('cl.cases.search')} />
      <Card padded={false}>
        {cases.length === 0 ? (
          p.q
            ? <EmptyState kind="search" title={t('list.noResults')} hint={t('list.noResultsHint')} />
            : <EmptyState kind="cases" title={t('cl.noCases')} hint={t('cl.noCasesHint')} />
        ) : (
          <Table>
            <THead>
              <Th>{t('cl.col.case')}</Th><Th>{t('cl.col.type')}</Th><Th>{t('cl.col.nextHearing')}</Th>
              <Th>{t('cl.col.opened')}</Th><Th>{t('cl.col.status')}</Th>
            </THead>
            <TBody>
              {cases.map((c) => (
                <Tr key={c.id}>
                  <Td label={t('cl.col.case')}>
                    <Link href={`/client/cases/${c.id}`} className={linkCls}>{c.title}</Link>
                    <p className="text-xs text-slate-500" dir="ltr">{c.case_number}</p>
                  </Td>
                  <Td label={t('cl.col.type')}>{t(`caseType.${c.case_type}` as never)}</Td>
                  <Td label={t('cl.col.nextHearing')}>{hearings[c.id] ? f.date(hearings[c.id].starts_at) : '—'}</Td>
                  <Td label={t('cl.col.opened')}>{f.date(c.opened_on)}</Td>
                  <Td label={t('cl.col.status')}><CaseStatusBadge status={c.status} /></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination total={count ?? 0} page={p.page} size={p.size} basePath="/client/cases" params={{ q: p.q }} />
      </Card>
    </>
  )
}
