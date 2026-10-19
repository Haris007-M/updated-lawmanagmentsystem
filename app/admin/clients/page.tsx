import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { AccountStatusBadge } from '@/components/Badge'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'

type ClientRow = { id: string; email: string; full_name: string | null; lawyer_id: string | null; is_active: boolean; password_set_at: string | null; created_at: string }

// Account directory only: who is a client of which firm. Cases, messages and documents are never shown here.
export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole('super_admin')
  const { t, f } = await getI18n()
  const pg = readPaging(await searchParams)
  const supabase = await createClient()

  let q = supabase.from('profiles')
    .select('id, email, full_name, lawyer_id, is_active, password_set_at, created_at', { count: 'exact' })
    .eq('role', 'client').order('created_at', { ascending: false }).range(pg.from, pg.to)
  if (pg.q) q = q.or(ilikeOr(['full_name', 'email'], pg.q))
  const { data, count } = await q
  const clients = (data ?? []) as ClientRow[]
  const firms = await getNames(supabase, clients.map((c) => c.lawyer_id))

  return (
    <>
      <PageHeader title={t('nav.clients')} description={t('adm.clients.desc')} />
      <ListToolbar basePath="/admin/clients" q={pg.q} placeholder={t('adm.clients.searchPlaceholder')} />
      <Card padded={false}>
        {clients.length === 0 ? (
          <EmptyState kind={pg.q ? 'search' : 'clients'} title={pg.q ? t('list.noResults') : t('adm.clients.none')} hint={pg.q ? t('list.noResultsHint') : undefined} />
        ) : (
          <>
            <Table>
              <THead><Th>{t('common.client')}</Th><Th>{t('adm.clients.lawyer')}</Th><Th>{t('adm.detail.joined')}</Th><Th>{t('common.status')}</Th></THead>
              <TBody>
                {clients.map((c) => (
                  <Tr key={c.id}>
                    <Td label={t('common.client')}>
                      <p className="font-medium text-slate-900">{c.full_name}</p>
                      <p className="text-xs text-slate-500" dir="ltr">{c.email}</p>
                    </Td>
                    <Td label={t('adm.clients.lawyer')}>
                      {c.lawyer_id ? <Link href={`/admin/lawyers/${c.lawyer_id}`} className={linkCls}>{firms[c.lawyer_id]?.full_name || firms[c.lawyer_id]?.email || t('common.unknown')}</Link> : '—'}
                    </Td>
                    <Td label={t('adm.detail.joined')}>{f.date(c.created_at)}</Td>
                    <Td label={t('common.status')}><AccountStatusBadge isActive={c.is_active} passwordSetAt={c.password_set_at} /></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination total={count ?? 0} page={pg.page} size={pg.size} basePath="/admin/clients" params={{ q: pg.q }} />
          </>
        )}
      </Card>
    </>
  )
}
