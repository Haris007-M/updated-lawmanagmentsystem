import Link from 'next/link'
import { Check, Circle } from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import EventList from '@/components/EventList'
import DashboardBanner from '@/components/DashboardBanner'
import StatCard from '@/components/StatCard'
import { buttonCls, ghostOnDarkBtnCls, linkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { dayTile } from '@/lib/lawyer-a-format'
import { formatTotals } from '@/lib/format'
import { todayISO } from '@/lib/tz'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, TaskRow } from '@/lib/types'

interface Dash {
  cases_total: number; cases_open: number; clients_total: number; tasks_open: number; tasks_overdue: number
  unbilled_minutes: number; week_cases: number[]; week_clients: number[]; week_invoices: number[]
  outstanding: Record<string, number>; outstanding_count: number
}

export default async function LawyerDashboard() {
  const me = await requireStaff()
  const { t, f, locale } = await getI18n()
  const supabase = await createClient()
  const isOwner = me.role === 'lawyer'
  const today = todayISO()
  const nowIso = new Date().toISOString()

  const [dashRes, hearingRes, eventRes, overdueRes, msgRes, juniorRes] = await Promise.all([
    supabase.rpc('firm_dashboard'),
    supabase.from('events').select('*').eq('lawyer_id', me.firm_id).eq('kind', 'hearing').gte('starts_at', nowIso)
      .order('starts_at', { ascending: true }).limit(3),
    supabase.from('events').select('*').eq('lawyer_id', me.firm_id).gte('starts_at', nowIso)
      .order('starts_at', { ascending: true }).limit(6),
    supabase.from('tasks').select('*').eq('lawyer_id', me.firm_id).eq('done', false).lt('due_date', today)
      .order('due_date', { ascending: true }).limit(5),
    supabase.from('case_messages').select('id, case_id, author_id, body, created_at').order('created_at', { ascending: false }).limit(5),
    isOwner
      ? supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'junior').eq('lawyer_id', me.firm_id)
      : Promise.resolve({ count: 0 }),
  ])

  const d = (dashRes.data ?? {}) as Partial<Dash>
  const hearings = (hearingRes.data ?? []) as EventRow[]
  const events = (eventRes.data ?? []) as EventRow[]
  const overdue = (overdueRes.data ?? []) as TaskRow[]
  const messages = (msgRes.data ?? []) as { id: string; case_id: string; author_id: string; body: string; created_at: string }[]

  const caseIds = [...new Set([...events.map((e) => e.case_id), ...overdue.map((x) => x.case_id), ...messages.map((m) => m.case_id)].filter(Boolean) as string[])]
  const [{ data: caseRows }, names] = await Promise.all([
    caseIds.length
      ? supabase.from('cases').select('id, title, client_id').in('id', caseIds)
      : Promise.resolve({ data: [] as { id: string; title: string; client_id: string }[] }),
    getNames(supabase, messages.map((m) => m.author_id)),
  ])
  const caseMap = Object.fromEntries((caseRows ?? []).map((c) => [c.id, c.title]))

  const checklist = isOwner ? [
    { done: (d.clients_total ?? 0) > 0, label: t('la.dash.step.client'), href: '/lawyer/clients' },
    { done: (d.cases_total ?? 0) > 0, label: t('la.dash.step.case'), href: '/lawyer/cases/new' },
    { done: me.mfa_enabled, label: t('la.dash.step.2fa'), href: '/lawyer/settings' },
    { done: (juniorRes.count ?? 0) > 0, label: t('la.dash.step.junior'), href: '/lawyer/team' },
  ] : []
  const stepsDone = checklist.filter((c) => c.done).length

  const overdueN = d.tasks_overdue ?? 0
  const hours = ((d.unbilled_minutes ?? 0) / 60)
  const wc = d.week_clients ?? []
  const added = wc.length > 1 ? Math.max(0, wc[wc.length - 1] - wc[0]) : 0

  return (
    <>
      <DashboardBanner
        image="/images/banner-lawyer.jpg"
        eyebrow={f.dayLong(today)}
        title={t('la.dash.welcome', { name: me.full_name?.split(' ')[0] ?? t('la.dash.counsel') })}
        subtitle={t('la.dash.subtitle')}
      >
        <Link href="/lawyer/cases/new" className={buttonCls}>{t('la.cases.new')}</Link>
        <Link href="/lawyer/clients" className={ghostOnDarkBtnCls}>{t('la.dash.addClient')}</Link>
      </DashboardBanner>

      {isOwner && stepsDone < checklist.length && (
        <Card title={t('la.dash.getStarted')} className="mb-6">
          <p className="mb-3 text-sm text-slate-600">{t('la.dash.stepsDone', { done: f.number(stepsDone), total: f.number(checklist.length) })}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-sm hover:bg-slate-50">
                  {c.done
                    ? <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    : <Circle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />}
                  <span className={c.done ? 'text-slate-500 line-through' : 'font-medium text-slate-800'}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t('la.dash.openCases')} value={f.number(d.cases_open ?? 0)}
          hint={t('la.dash.inTotal', { n: f.number(d.cases_total ?? 0) })}
          series={d.week_cases} caption={t('la.dash.newCases')} />
        <StatCard label={t('nav.clients')} value={f.number(d.clients_total ?? 0)}
          hint={t('la.dash.addedWeeks', { n: f.number(added) })}
          series={d.week_clients} caption={t('la.dash.clientGrowth')} />
        <StatCard label={t('la.dash.openTasks')} value={f.number(d.tasks_open ?? 0)}
          hint={overdueN ? t('la.dash.overdueN', { n: f.number(overdueN) }) : t('la.dash.nothingOverdue')}
          tone={overdueN ? 'alert' : 'default'} />
        {isOwner ? (
          <StatCard label={t('la.dash.awaiting')} value={formatTotals(d.outstanding ?? {}, f.money) || f.money(0, 'PKR')}
            hint={t('la.dash.sentInvoices', { n: f.number(d.outstanding_count ?? 0) })}
            tone={(d.outstanding_count ?? 0) > 0 ? 'warn' : 'default'} series={d.week_invoices} chart="bars" caption={t('la.dash.invoices8')} />
        ) : (
          <StatCard label={t('la.dash.unbilled')} value={f.number(Math.round(hours * 10) / 10)} hint={t('la.dash.hoursUnit')} />
        )}
      </div>

      {hearings.length > 0 && (
        <section className="mt-6" aria-label={t('la.dash.nextHearings')}>
          <h2 className="mb-3 text-sm font-semibold text-slate-800">{t('la.dash.nextHearings')}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {hearings.map((h) => {
              const tile = dayTile(h.starts_at, locale)
              return (
                <div key={h.id} className="flex gap-3 rounded-xl border border-slate-200 bg-surface p-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-navy-900 text-white">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-400">{tile.mon}</span>
                    <span className="text-xl font-semibold leading-none">{tile.day}</span>
                  </div>
                  <div className="min-w-0">
                    {h.case_id
                      ? <Link href={`/lawyer/cases/${h.case_id}?tab=schedule`} className={`${linkCls} block truncate`}>{caseMap[h.case_id] ?? h.title}</Link>
                      : <p className="truncate text-sm font-medium text-slate-900">{h.title}</p>}
                    <p className="text-xs text-slate-500">{f.time(h.starts_at)}{h.location ? ` · ${h.location}` : ''}</p>
                    <p className="truncate text-xs text-slate-500">{h.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t('la.dash.upcoming')} padded={false} action={<Link href="/lawyer/calendar" className={linkCls}>{t('nav.calendar')}</Link>}>
          <EventList events={events} caseTitles={caseMap} canEdit={false} cases={[]} emptyHint={t('la.dash.noEventsHint')} />
        </Card>

        <Card title={t('la.dash.overdueTitle')} padded={false} action={<Link href="/lawyer/tasks?view=overdue" className={linkCls}>{t('nav.tasks')}</Link>}>
          {overdue.length === 0 ? (
            <EmptyState compact title={t('la.dash.allCaughtUp')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {overdue.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-900">{x.title}</p>
                    {x.case_id && <p className="truncate text-xs text-slate-500">{caseMap[x.case_id]}</p>}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-alert-700">{f.date(x.due_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('la.dash.recentMessages')} padded={false} className="lg:col-span-2">
          {messages.length === 0 ? (
            <EmptyState compact title={t('la.dash.noMessages')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {messages.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/lawyer/cases/${m.case_id}?tab=messages`} className={`${linkCls} truncate`}>{caseMap[m.case_id] ?? t('common.case')}</Link>
                    <span className="shrink-0 text-xs text-slate-500">{f.dateTime(m.created_at)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{m.author_id === me.id ? t('common.you') : nameOf(names, m.author_id, t('common.unknown'))}: </span>{m.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
