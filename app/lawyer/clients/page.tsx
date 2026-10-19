import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import InviteForm from '@/components/InviteForm'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import SetupLinkButton from '@/components/SetupLinkButton'
import ConfirmButton from '@/components/ConfirmButton'
import { Field } from '@/components/Field'
import { AccountStatusBadge } from '@/components/Badge'
import { Table, TBody, Td, THead, Th, Tr } from '@/components/Table'
import { dangerLinkCls, linkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { firmUsage } from '@/lib/limits'
import { getI18n } from '@/lib/i18n'
import { mailConfigured } from '@/lib/mail'
import { ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import { inviteClient, resendClientInvite, resetClientTwoFactor, setClientActive } from '../actions'

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t, f } = await getI18n()
  const paging = readPaging(sp)
  const supabase = await createClient()
  const owner = me.role === 'lawyer'

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, password_set_at, mfa_enabled, created_at', { count: 'exact' })
    .eq('role', 'client').eq('lawyer_id', me.firm_id)
  if (paging.q) query = query.or(ilikeOr(['full_name', 'email', 'phone'], paging.q))
  const [{ data, count }, usage] = await Promise.all([
    query.order('created_at', { ascending: false }).range(paging.from, paging.to),
    firmUsage(me.firm_id),
  ])
  const clients = (data ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'phone' | 'is_active' | 'password_set_at' | 'mfa_enabled' | 'created_at'>[]

  const caseCount: Record<string, number> = {}
  if (clients.length) {
    const { data: caseData } = await supabase.from('cases').select('client_id').in('client_id', clients.map((c) => c.id))
    for (const c of caseData ?? []) caseCount[c.client_id] = (caseCount[c.client_id] ?? 0) + 1
  }
  const total = count ?? 0
  const inviteLabel = mailConfigured() ? t('la.clients.resendEmail') : t('la.clients.getLink')
  const full = usage.clients >= usage.maxClients

  return (
    <>
      <PageHeader title={t('nav.clients')} description={t('la.clients.intro')} />

      <details className="group mb-6" open={total === 0 && !paging.q ? true : undefined}>
        <summary className="mb-3 inline-flex cursor-pointer list-none items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-on-gold shadow-sm hover:bg-gold-400 max-sm:min-h-12 [&::-webkit-details-marker]:hidden">
          <UserPlus className="h-4 w-4" aria-hidden /> {t('la.clients.add')}
        </summary>
        {full ? (
          <p role="status" className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-700">{t('msg.limit.clients')}</p>
        ) : (
          <InviteForm
            action={inviteClient}
            heading={t('la.clients.createHeading')}
            buttonLabel={t('la.clients.create')}
            extra={<Field label={t('common.phone')} name="phone" type="tel" dir="ltr" placeholder="0300 1234567" hint={t('la.clients.phoneHint')} />}
          />
        )}
      </details>

      <ListToolbar basePath="/lawyer/clients" q={paging.q} placeholder={t('la.clients.searchPlaceholder')} />

      <Card padded={false} title={t('la.clients.count', { n: f.number(total) })}>
        {clients.length === 0 ? (
          paging.q
            ? <EmptyState kind="search" title={t('list.noResults')} hint={t('list.noResultsHint')} />
            : <EmptyState kind="clients" title={t('la.clients.none')} hint={t('la.clients.noneHint')} />
        ) : (
          <Table>
            <THead>
              <Th>{t('common.client')}</Th><Th>{t('common.phone')}</Th><Th>{t('nav.cases')}</Th><Th>{t('la.clients.added')}</Th><Th>{t('common.status')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th>
            </THead>
            <TBody>
              {clients.map((c) => (
                <Tr key={c.id} className="align-top">
                  <Td label={t('common.client')}>
                    <Link href={`/lawyer/clients/${c.id}`} className={linkCls}>{c.full_name ?? c.email}</Link>
                    <p className="text-xs text-slate-500" dir="ltr">{c.email}</p>
                  </Td>
                  <Td label={t('common.phone')}><span dir="ltr">{c.phone || '—'}</span></Td>
                  <Td label={t('nav.cases')}>{f.number(caseCount[c.id] ?? 0)}</Td>
                  <Td label={t('la.clients.added')}>{f.date(c.created_at)}</Td>
                  <Td label={t('common.status')}><AccountStatusBadge isActive={c.is_active} passwordSetAt={c.password_set_at} mfaEnabled={c.mfa_enabled} /></Td>
                  <Td label="" className="sm:text-end">
                    <div className="flex flex-col gap-2 sm:items-end">
                      {!c.password_set_at && c.is_active && (
                        <SetupLinkButton action={resendClientInvite} id={c.id} label={inviteLabel} />
                      )}
                      {owner && c.mfa_enabled && (
                        <form action={resetClientTwoFactor}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton message={t('la.clients.confirmReset2fa')} className={linkCls}>{t('la.clients.reset2fa')}</ConfirmButton>
                        </form>
                      )}
                      {owner && (
                        <form action={setClientActive}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="active" value={String(!c.is_active)} />
                          <button type="submit" className={c.is_active ? dangerLinkCls : linkCls}>
                            {c.is_active ? t('la.clients.suspend') : t('la.clients.reactivate')}
                          </button>
                        </form>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination total={total} page={paging.page} size={paging.size} basePath="/lawyer/clients" params={{ q: paging.q }} />
      </Card>
    </>
  )
}
