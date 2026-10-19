import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import DashboardBanner from '@/components/DashboardBanner'
import StatCard from '@/components/StatCard'
import { SubscriptionBadge } from '@/components/Badge'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { buttonCls, ghostOnDarkBtnCls, linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { formatBytes } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/tz'
import { daysUntil, inDaysIso, subEnd } from '@/lib/admin-data'
import type { PaymentRow, SubscriptionRow } from '@/lib/types'

type Stats = {
  lawyers: number; active_lawyers: number; clients: number
  cases: number; open_cases: number; documents: number; storage_bytes: number
}
type Billing = {
  trial: number; active: number; past_due: number; suspended: number
  pending_payments: number; expiring_soon: number; revenue_30d: number; new_leads: number
}

export default async function AdminDashboard() {
  const me = await requireRole('super_admin')
  const { t, f } = await getI18n()
  const supabase = await createClient()
  const soon = inDaysIso(7)

  const [statsRes, billRes, activityRes, pendingRes, endingRes, auditRes] = await Promise.all([
    supabase.rpc('admin_platform_stats').maybeSingle(),
    supabase.rpc('admin_billing_overview').maybeSingle(),
    supabase.rpc('admin_weekly_activity', { p_weeks: 8 }), // aggregate counts only, never contents
    supabase.from('payments').select('id, firm_id, plan, months, amount_cents, currency, created_at')
      .eq('status', 'pending').order('created_at').limit(5),
    supabase.from('subscriptions').select('firm_id, plan, status, trial_ends_at, current_period_end')
      .or(`and(status.eq.trial,trial_ends_at.lt.${soon}),and(status.in.(active,past_due),current_period_end.lt.${soon})`)
      .order('current_period_end', { nullsFirst: false }).limit(6),
    supabase.from('audit_log').select('id, actor_id, action, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  const stats = (statsRes.data as Stats | null) ?? { lawyers: 0, active_lawyers: 0, clients: 0, cases: 0, open_cases: 0, documents: 0, storage_bytes: 0 }
  const bill = (billRes.data as Billing | null) ?? { trial: 0, active: 0, past_due: 0, suspended: 0, pending_payments: 0, expiring_soon: 0, revenue_30d: 0, new_leads: 0 }
  const activity = (activityRes.data ?? []) as { new_lawyers: number; new_clients: number; new_cases: number; new_documents: number }[]
  const col = (k: 'new_lawyers' | 'new_clients' | 'new_cases' | 'new_documents') => activity.map((a) => Number(a[k]))
  const pending = (pendingRes.data ?? []) as Pick<PaymentRow, 'id' | 'firm_id' | 'plan' | 'months' | 'amount_cents' | 'currency' | 'created_at'>[]
  const ending = (endingRes.data ?? []) as Pick<SubscriptionRow, 'firm_id' | 'plan' | 'status' | 'trial_ends_at' | 'current_period_end'>[]
  const logs = (auditRes.data ?? []) as { id: number; actor_id: string | null; action: string; created_at: string }[]

  const names = await getNames(supabase, [...pending.map((p) => p.firm_id), ...ending.map((e) => e.firm_id), ...logs.map((l) => l.actor_id)])
  const n = (x: number) => f.number(Number(x))

  return (
    <>
      <DashboardBanner
        image="/banner-admin.jpg"
        eyebrow={f.dayLong(todayISO())}
        title={t('adm.dash.welcome', { name: me.full_name?.split(' ')[0] ?? t('role.super_admin') })}
        subtitle={t('adm.dash.subtitle')}
      >
        <Link href="/admin/billing" className={buttonCls}>{t('adm.dash.reviewPayments')}</Link>
        <Link href="/admin/lawyers" className={ghostOnDarkBtnCls}>{t('nav.firms')}</Link>
      </DashboardBanner>

      <h2 className="sr-only">{t('adm.dash.billing')}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t('adm.dash.active')} value={n(bill.active)} hint={t('adm.dash.revenue30', { amount: f.money(Number(bill.revenue_30d), 'PKR') })} tone="good" />
        <StatCard label={t('adm.dash.trials')} value={n(bill.trial)} hint={t('adm.dash.expiring', { n: n(bill.expiring_soon) })} />
        <StatCard label={t('adm.dash.pastDue')} value={n(bill.past_due)} hint={t('adm.dash.suspendedN', { n: n(bill.suspended) })} tone={bill.past_due > 0 ? 'alert' : 'default'} />
        <StatCard label={t('adm.dash.pending')} value={n(bill.pending_payments)} hint={t('adm.dash.newLeads', { n: n(bill.new_leads) })} tone={bill.pending_payments > 0 ? 'warn' : 'default'} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t('adm.dash.firms')} value={n(stats.lawyers)} hint={t('adm.dash.activeN', { n: n(stats.active_lawyers) })} series={col('new_lawyers')} caption={t('adm.dash.newWeeks')} />
        <StatCard label={t('nav.clients')} value={n(stats.clients)} hint={t('adm.dash.acrossFirms')} series={col('new_clients')} caption={t('adm.dash.newWeeks')} />
        <StatCard label={t('nav.cases')} value={n(stats.cases)} hint={t('adm.dash.openN', { n: n(stats.open_cases) })} series={col('new_cases')} caption={t('adm.dash.openedWeeks')} />
        <StatCard label={t('nav.documents')} value={n(stats.documents)} hint={t('adm.dash.stored', { size: formatBytes(Number(stats.storage_bytes)) })} series={col('new_documents')} chart="bars" caption={t('adm.dash.uploadedWeeks')} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t('adm.dash.awaiting')} padded={false} action={<Link href="/admin/billing" className={linkCls}>{t('common.view')}</Link>}>
          {pending.length === 0 ? (
            <EmptyState compact kind="invoices" title={t('adm.dash.noPending')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/lawyers/${p.firm_id}`} className="block truncate text-sm font-medium text-slate-900 hover:underline">{nameOf(names, p.firm_id, t('common.unknown'))}</Link>
                    <p className="text-xs text-slate-500">{p.plan} · {t('adm.months', { n: p.months })} · {f.date(p.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-brand-900" dir="ltr">{f.money(p.amount_cents, p.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('adm.dash.endingSoon')} padded={false} action={<Link href="/admin/lawyers" className={linkCls}>{t('nav.firms')}</Link>}>
          {ending.length === 0 ? (
            <EmptyState compact kind="calendar" title={t('adm.dash.noEnding')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {ending.map((e) => {
                const end = subEnd(e)
                const d = daysUntil(end)
                return (
                  <li key={e.firm_id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/lawyers/${e.firm_id}`} className="block truncate text-sm font-medium text-slate-900 hover:underline">{nameOf(names, e.firm_id, t('common.unknown'))}</Link>
                      <p className="text-xs text-slate-500">{f.date(end)}{d !== null ? ` · ${d < 0 ? t('adm.overdueDays', { n: Math.abs(d) }) : t('adm.inDays', { n: d })}` : ''}</p>
                    </div>
                    <SubscriptionBadge status={e.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title={t('adm.dash.recent')} padded={false} action={<Link href="/admin/audit" className={linkCls}>{t('adm.dash.viewAll')}</Link>}>
          {logs.length === 0 ? (
            <EmptyState compact kind="generic" title={t('adm.dash.noActivity')} />
          ) : (
            <Table>
              <THead><Th>{t('adm.audit.who')}</Th><Th>{t('adm.audit.action')}</Th><Th>{t('adm.audit.when')}</Th></THead>
              <TBody>
                {logs.map((l) => (
                  <Tr key={l.id}>
                    <Td label={t('adm.audit.who')}>{nameOf(names, l.actor_id, t('adm.system'))}</Td>
                    <Td label={t('adm.audit.action')} className="font-mono text-xs" ><span dir="ltr">{l.action}</span></Td>
                    <Td label={t('adm.audit.when')} className="whitespace-nowrap">{f.dateTime(l.created_at)}</Td>
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
