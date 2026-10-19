import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import Card from '@/components/Card'
import DocumentList from '@/components/DocumentList'
import EmptyState from '@/components/EmptyState'
import DashboardBanner from '@/components/DashboardBanner'
import StatCard from '@/components/StatCard'
import { CaseStatusBadge } from '@/components/Badge'
import { buttonCls, linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { formatTotals, sumByCurrency } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { cumulativeWeekly, nextDays, weekly } from '@/lib/series'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, DocumentRow, EventRow, InvoiceRow, MessageRow, Profile } from '@/lib/types'
import ClientEventList from './_components/ClientEventList'

export default async function ClientDashboard() {
  const me = await requireRole('client')
  const { t, f } = await getI18n()
  const supabase = await createClient()

  const [casesRes, eventsRes, invRes, docsRes, lawyerRes, msgRes] = await Promise.all([
    supabase.from('cases').select('id, lawyer_id, case_number, title, case_type, status, created_at').eq('client_id', me.id).order('updated_at', { ascending: false }).limit(100),
    supabase.from('events').select('id, lawyer_id, case_id, title, kind, starts_at, location, notes, outcome, visible_to_client, created_at')
      .gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(60),
    supabase.from('invoices').select('id, number, amount_cents, currency, status, issued_on, due_on').eq('client_id', me.id).order('created_at', { ascending: false }).limit(100),
    supabase.from('documents').select('*').eq('is_current', true).order('created_at', { ascending: false }).limit(5),
    me.lawyer_id ? supabase.from('profiles').select('full_name, firm_name, email, phone').eq('id', me.lawyer_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('case_messages').select('id, case_id, author_id, body, created_at').neq('author_id', me.id).order('created_at', { ascending: false }).limit(3),
  ])

  const cases = (casesRes.data ?? []) as CaseRow[]
  const allEvents = (eventsRes.data ?? []) as EventRow[]
  const events = allEvents.slice(0, 4)
  const hearing = allEvents.find((e) => e.kind === 'hearing')
  const invoices = (invRes.data ?? []) as unknown as InvoiceRow[]
  const due = invoices.filter((i) => i.status === 'sent')
  const docs = (docsRes.data ?? []) as DocumentRow[]
  const lawyer = lawyerRes.data as Pick<Profile, 'full_name' | 'firm_name' | 'email' | 'phone'> | null
  const messages = (msgRes.data ?? []) as MessageRow[]
  const active = cases.filter((c) => c.status !== 'closed')
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  const names = await getNames(supabase, [...docs.map((d) => d.uploaded_by), ...messages.map((m) => m.author_id)])

  return (
    <>
      <DashboardBanner
        image="/images/banner-client.jpg"
        eyebrow={f.dayLong(new Date().toISOString())}
        title={t('cl.welcome', { name: me.full_name?.split(' ')[0] ?? t('cl.welcomeFallback') })}
        subtitle={t('cl.welcomeSub')}
      >
        <Link href="/client/cases" className={buttonCls}>{t('cl.viewCases')}</Link>
      </DashboardBanner>

      {hearing && (
        <section aria-label={t('cl.nextHearing')} className="mb-5 flex items-center gap-4 rounded-xl border border-gold-200 bg-gold-50 p-4 sm:mb-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-on-gold"><CalendarClock className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gold-700">{t('cl.nextHearing')}</p>
            <p className="text-sm font-semibold text-slate-900">{hearing.title}{hearing.case_id && caseTitles[hearing.case_id] ? ` · ${caseTitles[hearing.case_id]}` : ''}</p>
            <p className="text-sm text-slate-700">{t('cl.nextHearing.on', { date: f.dayLong(hearing.starts_at), time: f.time(hearing.starts_at) })}{hearing.location ? ` · ${hearing.location}` : ''}</p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label={t('cl.stat.active')} value={f.number(active.length)} hint={t('cl.stat.total', { n: f.number(cases.length) })}
          series={cumulativeWeekly(cases.map((c) => c.created_at))} caption={t('cl.cap.cases')}
        />
        <StatCard
          label={t('cl.stat.upcoming')} value={f.number(allEvents.length)}
          series={nextDays(allEvents.map((e) => e.starts_at), 14)} chart="bars" caption={t('cl.cap.next14')}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label={t('cl.stat.balance')} value={formatTotals(sumByCurrency(due), f.money)} hint={t('cl.stat.invoices', { n: f.number(due.length) })}
            tone={due.length ? 'warn' : 'default'} series={weekly(invoices.map((i) => i.issued_on))} caption={t('cl.cap.invoices')}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={t('cl.yourCases')} padded={false} action={<Link href="/client/cases" className={linkCls}>{t('cl.viewAll')}</Link>}>
            {cases.length === 0 ? (
              <EmptyState kind="cases" title={t('cl.noCases')} hint={t('cl.noCasesHint')} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {cases.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <Link href={`/client/cases/${c.id}`} className={`${linkCls} block truncate`}>{c.title}</Link>
                      <p className="text-xs text-slate-500">{c.case_number} · {t(`caseType.${c.case_type}` as never)}</p>
                    </div>
                    <CaseStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t('cl.recentDocs')} padded={false} action={<Link href="/client/documents" className={linkCls}>{t('cl.allDocs')}</Link>}>
            <DocumentList docs={docs} caseTitles={caseTitles} names={names} role="client" meId={me.id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t('cl.yourLawyer')}>
            {lawyer ? (
              <div className="text-sm">
                <p className="font-medium text-slate-900">{lawyer.full_name}</p>
                {lawyer.firm_name && <p className="text-slate-600">{lawyer.firm_name}</p>}
                <p className="mt-2 text-slate-600" dir="ltr">{lawyer.email}</p>
                {lawyer.phone && <p className="text-slate-600" dir="ltr">{lawyer.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t('cl.notAvailable')}</p>
            )}
          </Card>
          <Card title={t('cl.recentMessages')} padded={false}>
            {messages.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">{t('cl.noMessages')}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {messages.map((m) => (
                  <li key={m.id} className="px-5 py-3">
                    <p className="text-xs text-slate-500">{nameOf(names, m.author_id, t('common.unknown'))} · {f.dateTime(m.created_at)}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-800">{m.body}</p>
                    <Link href={`/client/cases/${m.case_id}?tab=messages`} className={`${linkCls} mt-1 inline-block text-xs`}>{t('cl.openConversation')}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={t('cl.nextAppointments')} padded={false} action={<Link href="/client/appointments" className={linkCls}>{t('cl.all')}</Link>}>
            <ClientEventList events={events} caseTitles={caseTitles} />
          </Card>
          {due.length > 0 && (
            <Card title={t('cl.unpaid')} padded={false} action={<Link href="/client/invoices" className={linkCls}>{t('cl.all')}</Link>}>
              <ul className="divide-y divide-slate-100">
                {due.slice(0, 3).map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/client/invoices/${i.id}`} className={linkCls}>{i.number}</Link>
                    <span dir="ltr" className="font-medium text-slate-900">{f.money(i.amount_cents, i.currency)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
