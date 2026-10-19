import Link from 'next/link'
import Card from '@/components/Card'
import ConfirmButton from '@/components/ConfirmButton'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import WhatsAppButton from '@/components/WhatsAppButton'
import { Badge, type Tone } from '@/components/Badge'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { dangerLinkCls, inputCls, linkCls, smallBtnCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { first, ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import { LEAD_STATUSES } from '@/lib/admin-data'
import type { LeadRow } from '@/lib/types'
import { deleteLead, setLeadStatus } from '../actions'

const TONE: Record<LeadRow['status'], Tone> = { new: 'blue', contacted: 'amber', won: 'green', lost: 'slate' }

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole('super_admin')
  const { t, f } = await getI18n()
  const sp = await searchParams
  const pg = readPaging(sp)
  const status = (LEAD_STATUSES as readonly string[]).includes(first(sp.status)) ? first(sp.status) : ''
  const supabase = await createClient()

  let q = supabase.from('leads').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(pg.from, pg.to)
  if (status) q = q.eq('status', status)
  if (pg.q) q = q.or(ilikeOr(['name', 'email', 'phone', 'firm_name', 'city'], pg.q))
  const { data, count } = await q
  const leads = (data ?? []) as LeadRow[]

  return (
    <>
      <PageHeader title={t('nav.leads')} description={t('adm.leads.desc')} />
      <ListToolbar basePath="/admin/leads" q={pg.q} placeholder={t('adm.leads.searchPlaceholder')} active={Boolean(status)}>
        <select name="status" defaultValue={status} aria-label={t('common.status')} className={`${inputCls} w-auto`}>
          <option value="">{t('list.allStatuses')}</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(`adm.lead.status.${s}` as const)}</option>)}
        </select>
      </ListToolbar>

      <Card padded={false}>
        {leads.length === 0 ? (
          <EmptyState kind={pg.q || status ? 'search' : 'clients'} title={pg.q || status ? t('list.noResults') : t('adm.leads.none')} hint={pg.q || status ? t('list.noResultsHint') : t('adm.leads.noneHint')} />
        ) : (
          <>
            <Table>
              <THead>
                <Th>{t('common.name')}</Th><Th>{t('adm.leads.contact')}</Th><Th>{t('adm.leads.message')}</Th>
                <Th>{t('common.date')}</Th><Th>{t('common.status')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th>
              </THead>
              <TBody>
                {leads.map((l) => (
                  <Tr key={l.id} className="align-top">
                    <Td label={t('common.name')}>
                      <p className="font-medium text-slate-900">{l.name}</p>
                      <p className="text-xs text-slate-500">{[l.firm_name, l.city].filter(Boolean).join(' · ') || '—'}</p>
                    </Td>
                    <Td label={t('adm.leads.contact')}>
                      {l.email && <p className="text-sm" dir="ltr"><a href={`mailto:${l.email}`} className={linkCls}>{l.email}</a></p>}
                      {l.phone && <p className="text-sm text-slate-700" dir="ltr">{l.phone}</p>}
                      <div className="mt-1.5"><WhatsAppButton phone={l.phone} message={t('adm.leads.waMessage', { name: l.name })} sms={false} /></div>
                    </Td>
                    <Td label={t('adm.leads.message')} className="max-w-xs"><p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-700">{l.message || '—'}</p></Td>
                    <Td label={t('common.date')} className="whitespace-nowrap">{f.date(l.created_at)}</Td>
                    <Td label={t('common.status')}>
                      <Badge tone={TONE[l.status]}>{t(`adm.lead.status.${l.status}` as const)}</Badge>
                      <form action={setLeadStatus} className="mt-2 flex items-center gap-1.5">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="status" defaultValue={l.status} aria-label={t('common.status')} className={`${inputCls} !w-auto !py-1.5 !text-xs`}>
                          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(`adm.lead.status.${s}` as const)}</option>)}
                        </select>
                        <button type="submit" className={smallBtnCls}>{t('common.save')}</button>
                      </form>
                    </Td>
                    <Td label="" className="text-end">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/admin/lawyers/new?${new URLSearchParams({ name: l.name, email: l.email ?? '', firm: l.firm_name ?? '' }).toString()}`}
                          className={linkCls}
                        >{t('adm.leads.createFirm')}</Link>
                        <form action={deleteLead}>
                          <input type="hidden" name="id" value={l.id} />
                          <ConfirmButton message={t('common.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
                        </form>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination total={count ?? 0} page={pg.page} size={pg.size} basePath="/admin/leads" params={{ q: pg.q, status }} />
          </>
        )}
      </Card>
    </>
  )
}
