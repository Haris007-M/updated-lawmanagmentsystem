import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import WhatsAppButton from '@/components/WhatsAppButton'
import SetupLinkButton from '@/components/SetupLinkButton'
import { AccountStatusBadge, CaseStatusBadge } from '@/components/Badge'
import { Table, TBody, Td, THead, Th, Tr } from '@/components/Table'
import { buttonCls, linkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { mailConfigured } from '@/lib/mail'
import { nextHearingByCase } from '@/lib/lawyer-a-data'
import { caseTypeLabel } from '@/lib/lawyer-a-format'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, Profile } from '@/lib/types'
import { resendClientInvite } from '../../actions'

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff()
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { t, f } = await getI18n()

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles').select('id, full_name, email, phone, is_active, password_set_at, mfa_enabled, created_at')
    .eq('id', id).eq('role', 'client').eq('lawyer_id', me.firm_id).maybeSingle()
  if (!data) notFound()
  const client = data as Pick<Profile, 'id' | 'full_name' | 'email' | 'phone' | 'is_active' | 'password_set_at' | 'mfa_enabled' | 'created_at'>

  const { data: caseData } = await supabase
    .from('cases').select('id, case_number, title, case_type, status, court, opened_on')
    .eq('lawyer_id', me.firm_id).eq('client_id', id).order('updated_at', { ascending: false }).limit(100)
  const cases = (caseData ?? []) as Pick<CaseRow, 'id' | 'case_number' | 'title' | 'case_type' | 'status' | 'court' | 'opened_on'>[]
  const hearings = await nextHearingByCase(supabase, me.firm_id, cases.map((c) => c.id))
  const name = client.full_name ?? client.email
  const firm = me.firm_name ?? ''

  const reminder = (c: (typeof cases)[number]) =>
    t('la.wa.hearing', { name, case: c.case_number, title: c.title, date: f.dayLong(hearings[c.id]), time: f.time(hearings[c.id]), court: c.court ? ` (${c.court})` : '', firm })

  return (
    <>
      <PageHeader
        title={name}
        description={client.email}
        back={{ href: '/lawyer/clients', label: t('la.clients.all') }}
        actions={<Link href={`/lawyer/cases/new?client=${client.id}`} className={buttonCls}>{t('la.cases.new')}</Link>}
      />
      <div className="grid gap-6">
        <Card title={t('la.clients.contact')}>
          <dl className="grid gap-4 text-sm sm:grid-cols-4">
            <div><dt className="text-slate-500">{t('common.email')}</dt><dd className="mt-0.5 break-all text-slate-900" dir="ltr">{client.email}</dd></div>
            <div><dt className="text-slate-500">{t('common.phone')}</dt><dd className="mt-0.5 text-slate-900" dir="ltr">{client.phone || '—'}</dd></div>
            <div><dt className="text-slate-500">{t('la.clients.since')}</dt><dd className="mt-0.5 text-slate-900">{f.date(client.created_at)}</dd></div>
            <div><dt className="text-slate-500">{t('la.clients.account')}</dt><dd className="mt-0.5"><AccountStatusBadge isActive={client.is_active} passwordSetAt={client.password_set_at} mfaEnabled={client.mfa_enabled} /></dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap items-start gap-4 border-t border-slate-100 pt-4">
            {client.phone && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">{t('la.wa.contact')}</p>
                <WhatsAppButton phone={client.phone} message={t('la.wa.hello', { name, firm })} whatsappLabel={t('la.wa.whatsapp')} smsLabel={t('la.wa.sms')} />
              </div>
            )}
            {!client.password_set_at && client.is_active && (
              <SetupLinkButton action={resendClientInvite} id={client.id} label={mailConfigured() ? t('la.clients.resendEmail') : t('la.clients.getLink')} />
            )}
          </div>
        </Card>

        <Card title={t('la.clients.casesTitle', { n: cases.length })} padded={false}>
          {cases.length === 0 ? (
            <EmptyState kind="cases" title={t('la.clients.noCases')} action={<Link href={`/lawyer/cases/new?client=${client.id}`} className={buttonCls}>{t('la.cases.new')}</Link>} />
          ) : (
            <Table>
              <THead><Th>{t('common.case')}</Th><Th>{t('common.type')}</Th><Th>{t('la.cases.nextHearing')}</Th><Th>{t('common.status')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th></THead>
              <TBody>
                {cases.map((c) => (
                  <Tr key={c.id}>
                    <Td label={t('common.case')}>
                      <Link href={`/lawyer/cases/${c.id}`} className={linkCls}>{c.title}</Link>
                      <p className="text-xs text-slate-500">{c.case_number}</p>
                    </Td>
                    <Td label={t('common.type')}>{caseTypeLabel(t, c.case_type)}</Td>
                    <Td label={t('la.cases.nextHearing')}>{hearings[c.id] ? `${f.date(hearings[c.id])} · ${f.time(hearings[c.id])}` : '—'}</Td>
                    <Td label={t('common.status')}><CaseStatusBadge status={c.status} /></Td>
                    <Td label="">
                      {hearings[c.id] && client.phone && (
                        <WhatsAppButton phone={client.phone} message={reminder(c)} whatsappLabel={t('la.wa.remindHearing')} sms={false} />
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
