import Link from 'next/link'
import { Plus } from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { AccountStatusBadge, SubscriptionBadge } from '@/components/Badge'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { buttonCls, linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { formatBytes } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { getPlan } from '@/lib/plans'
import { readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { SubStatus } from '@/lib/types'

type Firm = {
  firm_id: string; email: string; full_name: string | null; firm_name: string | null; is_active: boolean
  created_at: string; password_set_at: string | null; mfa_enabled: boolean; plan: string | null
  sub_status: SubStatus | null; effective: SubStatus | null; ends_at: string | null
  junior_count: number; client_count: number; case_count: number; open_case_count: number
  storage_bytes: number; total: number
}

export default async function FirmsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole('super_admin')
  const { t, f } = await getI18n()
  const pg = readPaging(await searchParams)
  const supabase = await createClient()

  const { data } = await supabase.rpc('admin_firms', { p_q: pg.q, p_limit: pg.size, p_offset: pg.from })
  const firms = (data ?? []) as Firm[]
  const total = firms[0] ? Number(firms[0].total) : 0

  return (
    <>
      <PageHeader
        title={t('nav.firms')}
        description={t('adm.firms.desc')}
        actions={<Link href="/admin/lawyers/new" className={buttonCls}><Plus className="h-4 w-4" aria-hidden />{t('adm.firms.new')}</Link>}
      />
      <ListToolbar basePath="/admin/lawyers" q={pg.q} placeholder={t('adm.firms.searchPlaceholder')} />

      <Card padded={false}>
        {firms.length === 0 ? (
          <EmptyState
            kind={pg.q ? 'search' : 'team'}
            title={pg.q ? t('list.noResults') : t('adm.firms.none')}
            hint={pg.q ? t('list.noResultsHint') : t('adm.firms.noneHint')}
            action={!pg.q && <Link href="/admin/lawyers/new" className={buttonCls}>{t('adm.firms.new')}</Link>}
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>{t('adm.firms.firm')}</Th><Th>{t('adm.firms.plan')}</Th><Th>{t('adm.firms.access')}</Th>
                <Th>{t('adm.firms.usage')}</Th><Th>{t('adm.firms.account')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th>
              </THead>
              <TBody>
                {firms.map((x) => (
                  <Tr key={x.firm_id}>
                    <Td label={t('adm.firms.firm')}>
                      <Link href={`/admin/lawyers/${x.firm_id}`} className="font-medium text-slate-900 hover:underline">{x.firm_name || x.full_name || x.email}</Link>
                      <p className="text-xs text-slate-500">{x.full_name} · <span dir="ltr">{x.email}</span></p>
                    </Td>
                    <Td label={t('adm.firms.plan')}>{x.plan ? getPlan(x.plan).name : '—'}</Td>
                    <Td label={t('adm.firms.access')}>
                      {x.effective ? <SubscriptionBadge status={x.effective} /> : '—'}
                      <p className="mt-1 text-xs text-slate-500">{x.ends_at ? t('adm.until', { date: f.date(x.ends_at) }) : t('adm.noEnd')}</p>
                    </Td>
                    <Td label={t('adm.firms.usage')}>
                      <p className="text-xs text-slate-600">{t('adm.firms.usageLine', { juniors: f.number(Number(x.junior_count)), clients: f.number(Number(x.client_count)), cases: f.number(Number(x.case_count)) })}</p>
                      <p className="text-xs text-slate-500">{formatBytes(Number(x.storage_bytes))}</p>
                    </Td>
                    <Td label={t('adm.firms.account')}><AccountStatusBadge isActive={x.is_active} passwordSetAt={x.password_set_at} mfaEnabled={x.mfa_enabled} /></Td>
                    <Td label="" className="text-end"><Link href={`/admin/lawyers/${x.firm_id}`} className={linkCls}>{t('common.open')}</Link></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination total={total} page={pg.page} size={pg.size} basePath="/admin/lawyers" params={{ q: pg.q }} />
          </>
        )}
      </Card>
      <p className="mt-4 text-xs text-slate-500">{t('adm.firms.note')}</p>
    </>
  )
}
