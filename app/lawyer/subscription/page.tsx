import Link from 'next/link'
import { Check, Landmark, MessageCircle } from 'lucide-react'
import { Badge, SubscriptionBadge } from '@/components/Badge'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import LbPaymentForm, { type PlanChoice } from '@/components/LbPaymentForm'
import LbUsageMeter from '@/components/LbUsageMeter'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { linkCls, smallBtnCls } from '@/components/ui'
import { requireOwner } from '@/lib/auth'
import { formatBytes } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { firmUsage } from '@/lib/limits'
import { first, readPaging, type SearchParams } from '@/lib/paging'
import { DISCOUNT_BY_MONTHS, MONTH_OPTIONS, PLAN_ORDER, PLANS, getPlan, planPrice } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/tz'
import { whatsappLink } from '@/lib/whatsapp'
import type { PaymentRow, PlatformSettings } from '@/lib/types'

const PAY_TONE = { pending: 'amber', confirmed: 'green', rejected: 'red' } as const

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // must keep working while the firm is locked: this is the page that unlocks it
  const me = await requireOwner({ allowLocked: true })
  const sp = await searchParams
  const { t, f } = await getI18n()
  const paging = readPaging(sp, 10)
  void first
  const sb = await createClient()

  const [platform, pays, usage] = await Promise.all([
    sb.from('platform_settings').select('id, bank_name, account_title, account_number, iban, branch, payment_instructions, support_whatsapp, support_email, trial_days, grace_days').eq('id', 1).maybeSingle(),
    sb.from('payments').select('id, firm_id, plan, months, amount_cents, currency, method, reference, paid_on, proof_path, note, status, reviewed_by, reviewed_at, review_note, created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).range(paging.from, paging.to),
    firmUsage(me.firm_id),
  ])
  const bank = platform.data as PlatformSettings | null
  const payments = (pays.data ?? []) as PaymentRow[]
  const plan = getPlan(me.plan)
  const status = me.billing_status ?? 'trial'
  const price = (id: string, months: number) => f.money(planPrice(id, months) * 100, 'PKR')

  const choices: PlanChoice[] = PLAN_ORDER.map((id) => ({
    id, name: PLANS[id].name, prices: Object.fromEntries(MONTH_OPTIONS.map((m) => [m, planPrice(id, m)])) as Record<number, number>,
  }))
  const hasPending = payments.some((p) => p.status === 'pending')
  const wa = whatsappLink(bank?.support_whatsapp, t('lb.sub.waSupport', { firm: me.firm_name ?? me.email }))

  return (
    <>
      <PageHeader title={t('nav.subscription')} description={t('lb.sub.subtitle')} />

      {me.billing === 'locked' && (
        <p role="alert" className="mb-6 rounded-xl border border-alert-200 bg-alert-50 px-4 py-3 text-sm text-alert-700">{t('shell.lockedBanner')} {t('lb.sub.lockedHelp')}</p>
      )}
      {me.billing === 'grace' && (
        <p role="alert" className="mb-6 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800">{t('shell.dueBanner')}</p>
      )}
      {hasPending && (
        <p role="status" className="mb-6 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800">{t('lb.sub.pendingNote')}</p>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title={t('lb.sub.current')} className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div><p className="text-xs text-slate-500">{t('lb.sub.plan')}</p><p className="font-display text-2xl font-semibold text-brand-900">{plan.name}</p></div>
            <div><p className="text-xs text-slate-500">{t('common.status')}</p><div className="mt-1"><SubscriptionBadge status={status} /></div></div>
            <div>
              <p className="text-xs text-slate-500">{status === 'trial' ? t('lb.sub.trialEnds') : t('lb.sub.renewsOn')}</p>
              <p className="text-sm font-medium text-slate-900">{me.billing_ends_at ? f.date(me.billing_ends_at) : '—'}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <LbUsageMeter label={t('lb.team.juniors')} used={usage.juniors} max={usage.maxJuniors} usedText={f.number(usage.juniors)} maxText={f.number(usage.maxJuniors)} />
            <LbUsageMeter label={t('lb.team.clients')} used={usage.clients} max={usage.maxClients} usedText={f.number(usage.clients)} maxText={f.number(usage.maxClients)} />
            <LbUsageMeter label={t('lb.team.storage')} used={usage.storageBytes} max={usage.maxStorageBytes} usedText={formatBytes(usage.storageBytes)} maxText={formatBytes(usage.maxStorageBytes)} />
          </div>
        </Card>

        <Card title={t('lb.sub.bankTitle')}>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800"><Landmark className="h-4 w-4 text-gold-600" aria-hidden />{bank?.bank_name || '—'}</div>
          {bank?.account_title || bank?.account_number || bank?.iban ? (
            <dl className="mt-3 space-y-2 text-sm">
              {bank?.account_title && <div><dt className="text-xs text-slate-500">{t('lb.sub.accountTitle')}</dt><dd className="font-medium text-slate-900">{bank.account_title}</dd></div>}
              {bank?.account_number && <div><dt className="text-xs text-slate-500">{t('lb.sub.accountNumber')}</dt><dd className="font-mono text-slate-900" dir="ltr">{bank.account_number}</dd></div>}
              {bank?.iban && <div><dt className="text-xs text-slate-500">IBAN</dt><dd className="break-all font-mono text-slate-900" dir="ltr">{bank.iban}</dd></div>}
              {bank?.branch && <div><dt className="text-xs text-slate-500">{t('lb.sub.branch')}</dt><dd className="text-slate-900">{bank.branch}</dd></div>}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t('lb.sub.bankMissing')}</p>
          )}
          {bank?.payment_instructions && <p className="mt-3 whitespace-pre-line border-t border-slate-100 pt-3 text-xs text-slate-600">{bank.payment_instructions}</p>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={`${smallBtnCls} mt-4`}><MessageCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden />{t('lb.sub.contactSupport')}</a>}
        </Card>
      </div>

      <section aria-labelledby="plans-h" className="mb-6">
        <h2 id="plans-h" className="mb-3 text-[15px] font-semibold text-brand-900">{t('lb.sub.plans')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id]
            const current = id === plan.id
            return (
              <div key={id} className={`rounded-xl border p-5 ${p.highlight ? 'border-gold-400 ring-2 ring-gold-400/30' : 'border-slate-200'} bg-surface`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-brand-900">{p.name}</h3>
                  {current && <Badge tone="gold">{t('lb.sub.yourPlan')}</Badge>}
                </div>
                <p className="mt-2"><span className="text-2xl font-semibold text-brand-900">{f.money(p.priceMonthly * 100, 'PKR')}</span> <span className="text-sm text-slate-500">/ {t('lb.sub.month')}</span></p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {[t('lb.sub.limitJuniors', { n: p.maxJuniors }), t('lb.sub.limitClients', { n: p.maxClients }), t('lb.sub.limitStorage', { n: p.storageGb })].map((l) => (
                    <li key={l} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{l}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <Table>
            <THead><Th>{t('lb.sub.months')}</Th>{PLAN_ORDER.map((id) => <Th key={id}>{PLANS[id].name}</Th>)}</THead>
            <TBody>
              {MONTH_OPTIONS.map((m) => (
                <Tr key={m}>
                  <Td label={t('lb.sub.months')} className="font-medium text-slate-900">
                    {t('lb.sub.monthsN', { n: m })}
                    {DISCOUNT_BY_MONTHS[m] < 1 && <span className="ms-2 text-xs text-emerald-700">{t('lb.sub.save', { pct: Math.round((1 - DISCOUNT_BY_MONTHS[m]) * 100) })}</span>}
                  </Td>
                  {PLAN_ORDER.map((id) => <Td key={id} label={PLANS[id].name}>{price(id, m)}</Td>)}
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title={t('lb.sub.howTitle')}>
          <ol className="list-decimal space-y-2 ps-5 text-sm text-slate-600">
            <li>{t('lb.sub.how1')}</li><li>{t('lb.sub.how2')}</li><li>{t('lb.sub.how3')}</li><li>{t('lb.sub.how4')}</li>
          </ol>
        </Card>
        <Card title={t('lb.sub.payTitle')}>
          <LbPaymentForm plans={choices} months={MONTH_OPTIONS} defaultPlan={plan.id} today={todayISO()} />
        </Card>
      </div>

      <Card title={t('lb.sub.history')} padded={false}>
        {payments.length === 0 ? (
          <EmptyState kind="invoices" compact title={t('lb.sub.noPayments')} />
        ) : (
          <Table>
            <THead><Th>{t('common.date')}</Th><Th>{t('lb.sub.plan')}</Th><Th>{t('common.amount')}</Th><Th>{t('lb.sub.reference')}</Th><Th>{t('common.status')}</Th><Th><span className="sr-only">{t('lb.sub.proof')}</span></Th></THead>
            <TBody>
              {payments.map((p) => (
                <Tr key={p.id}>
                  <Td label={t('common.date')}>{f.date(p.created_at)}</Td>
                  <Td label={t('lb.sub.plan')}>{getPlan(p.plan).name} · {t('lb.sub.monthsN', { n: p.months })}</Td>
                  <Td label={t('common.amount')}>{f.money(p.amount_cents, p.currency)}</Td>
                  <Td label={t('lb.sub.reference')}><span dir="ltr">{p.reference ?? '—'}</span></Td>
                  <Td label={t('common.status')}>
                    <Badge tone={PAY_TONE[p.status]}>{t(`lb.sub.pay.${p.status}`)}</Badge>
                    {p.status === 'rejected' && p.review_note && <p className="mt-1 text-xs text-slate-500">{p.review_note}</p>}
                  </Td>
                  <Td label="">{p.proof_path && <a href={`/api/proof-upload/${p.id}`} className={linkCls}>{t('lb.sub.viewProof')}</a>}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination total={pays.count ?? 0} page={paging.page} size={paging.size} basePath="/lawyer/subscription" />
      </Card>
      <p className="mt-4 text-xs text-slate-500"><Link href="/terms" className="underline">{t('auth.terms')}</Link></p>
    </>
  )
}
