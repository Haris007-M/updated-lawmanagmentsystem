import Link from 'next/link'
import { Download } from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { secondaryBtnCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { cleanTerm, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'

type Log = { id: number; actor_id: string | null; action: string; target_id: string | null; meta: Record<string, unknown>; created_at: string }

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole('super_admin')
  const { t, f } = await getI18n()
  const pg = readPaging(await searchParams, 30)
  const supabase = await createClient()

  let q = supabase.from('audit_log').select('id, actor_id, action, target_id, meta, created_at', { count: 'exact' })
    .order('created_at', { ascending: false }).range(pg.from, pg.to)
  const term = cleanTerm(pg.q)
  if (term) q = q.ilike('action', `%${term}%`)
  const { data, count } = await q
  const logs = (data ?? []) as Log[]
  const names = await getNames(supabase, logs.flatMap((l) => [l.actor_id, l.target_id]))

  return (
    <>
      <PageHeader
        title={t('nav.audit')}
        description={t('adm.audit.desc')}
        actions={<Link href={`/admin/audit/export${term ? `?q=${encodeURIComponent(term)}` : ''}`} className={secondaryBtnCls} prefetch={false}><Download className="h-4 w-4" aria-hidden />{t('adm.audit.export')}</Link>}
      />
      <ListToolbar basePath="/admin/audit" q={pg.q} placeholder={t('adm.audit.searchPlaceholder')} />
      <Card padded={false}>
        {logs.length === 0 ? (
          <EmptyState kind={term ? 'search' : 'generic'} title={term ? t('list.noResults') : t('adm.audit.none')} hint={term ? t('list.noResultsHint') : undefined} />
        ) : (
          <>
            <Table>
              <THead><Th>{t('adm.audit.when')}</Th><Th>{t('adm.audit.who')}</Th><Th>{t('adm.audit.action')}</Th><Th>{t('adm.audit.target')}</Th><Th>{t('common.details')}</Th></THead>
              <TBody>
                {logs.map((l) => (
                  <Tr key={l.id} className="align-top">
                    <Td label={t('adm.audit.when')} className="whitespace-nowrap">{f.dateTime(l.created_at)}</Td>
                    <Td label={t('adm.audit.who')}>{nameOf(names, l.actor_id, t('adm.system'))}</Td>
                    <Td label={t('adm.audit.action')} className="font-mono text-xs"><span dir="ltr">{l.action}</span></Td>
                    <Td label={t('adm.audit.target')}>{l.target_id && names[l.target_id] ? nameOf(names, l.target_id) : l.target_id ? <span dir="ltr" className="font-mono text-xs">{l.target_id.slice(0, 8)}</span> : '—'}</Td>
                    <Td label={t('common.details')} className="max-w-xs break-all text-xs text-slate-500"><span dir="ltr">{Object.keys(l.meta ?? {}).length ? JSON.stringify(l.meta) : '—'}</span></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination total={count ?? 0} page={pg.page} size={pg.size} basePath="/admin/audit" params={{ q: pg.q }} />
          </>
        )}
      </Card>
    </>
  )
}
