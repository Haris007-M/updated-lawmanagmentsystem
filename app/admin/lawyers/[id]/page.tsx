import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/Card'
import ConfirmButton from '@/components/ConfirmButton'
import EmptyState from '@/components/EmptyState'
import ActionForm from '@/components/ActionForm'
import PageHeader from '@/components/PageHeader'
import SetupLinkButton from '@/components/SetupLinkButton'
import { AccountStatusBadge, SubscriptionBadge } from '@/components/Badge'
import { Field, Select, TextArea } from '@/components/Field'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { dangerBtnCls, dangerLinkCls, linkCls, secondaryBtnCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { formatBytes } from '@/lib/format'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { firmUsage } from '@/lib/limits'
import { mailConfigured } from '@/lib/mail'
import { PLANS, PLAN_ORDER, getPlan } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { EXTEND_MONTHS, MANUAL_STATUSES, daysUntil, subEnd, toDateInput } from '@/lib/admin-data'
import type { PaymentRow, Profile, SubStatus, SubscriptionRow } from '@/lib/types'
import PayStatusBadge from '../../_components/PayStatusBadge'
import UsageBar from '../../_components/UsageBar'
import {
  extendSubscription, grantTrial, resendLawyerInvite, resetLawyerTwoFactor, setLawyerActive,
  setSubscriptionStatus, updateSubscription,
} from '../../actions'

type FirmRow = { firm_id: string; effective: SubStatus | null; case_count: number; open_case_count: number }

export default async function FirmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('super_admin')
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { t, f } = await getI18n()
  const supabase = await createClient()

  const [profRes, subRes, payRes, usage] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, firm_name, phone, is_active, created_at, password_set_at, mfa_enabled, role').eq('id', id).eq('role', 'lawyer').maybeSingle(),
    supabase.from('subscriptions').select('*').eq('firm_id', id).maybeSingle(),
    supabase.from('payments').select('id, plan, months, amount_cents, currency, reference, paid_on, proof_path, status, review_note, created_at').eq('firm_id', id).order('created_at', { ascending: false }).limit(20),
    firmUsage(id),
  ])
  const p = profRes.data as Pick<Profile, 'id' | 'email' | 'full_name' | 'firm_name' | 'phone' | 'is_active' | 'created_at' | 'password_set_at' | 'mfa_enabled'> | null
  if (!p) notFound()
  const sub = subRes.data as SubscriptionRow | null
  const payments = (payRes.data ?? []) as Pick<PaymentRow, 'id' | 'plan' | 'months' | 'amount_cents' | 'currency' | 'reference' | 'paid_on' | 'proof_path' | 'status' | 'review_note' | 'created_at'>[]

  // counts only (case numbers, never contents): the firm row from the aggregate function
  const { data: rows } = await supabase.rpc('admin_firms', { p_q: p.email, p_limit: 5, p_offset: 0 })
  const row = ((rows ?? []) as FirmRow[]).find((r) => r.firm_id === id)
  const effective = row?.effective ?? sub?.status ?? null
  const end = sub ? subEnd(sub) : null
  const left = daysUntil(end)
  const plan = getPlan(sub?.plan ?? usage.plan)
  const mail = mailConfigured()
  const pct = (used: number, max: number) => t('adm.of', { used: f.number(used), max: f.number(max) })

  return (
    <>
      <PageHeader
        title={p.firm_name || p.full_name || p.email}
        description={`${p.full_name ?? ''} · ${p.email}`}
        back={{ href: '/admin/lawyers', label: t('nav.firms') }}
        actions={<AccountStatusBadge isActive={p.is_active} passwordSetAt={p.password_set_at} mfaEnabled={p.mfa_enabled} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ------------------------------------------------ summary */}
          <Card title={t('adm.detail.subscription')}>
            {!sub && <p className="mb-4 rounded-lg border border-gold-200 bg-gold-50 px-3.5 py-2.5 text-sm text-gold-800">{t('adm.detail.noSub')}</p>}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">{t('common.status')}</dt>
                <dd className="mt-1">{effective ? <SubscriptionBadge status={effective} /> : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('adm.firms.plan')}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{plan.name} · {f.money(plan.priceMonthly * 100, 'PKR')}/{t('adm.perMonth')}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('adm.detail.accessEnds')}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{end ? f.date(end) : t('adm.noEnd')}</dd>
                {left !== null && <dd className={`text-xs ${left < 0 ? 'text-alert-700' : 'text-slate-500'}`}>{left < 0 ? t('adm.overdueDays', { n: Math.abs(left) }) : t('adm.inDays', { n: left })}</dd>}
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('adm.detail.grace')}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{t('adm.days', { n: sub?.grace_days ?? 5 })}</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <UsageBar label={t('adm.detail.juniors')} used={usage.juniors} max={usage.maxJuniors} text={pct(usage.juniors, usage.maxJuniors)} />
              <UsageBar label={t('nav.clients')} used={usage.clients} max={usage.maxClients} text={pct(usage.clients, usage.maxClients)} />
              <UsageBar label={t('adm.detail.storage')} used={usage.storageBytes} max={usage.maxStorageBytes} text={`${formatBytes(usage.storageBytes)} / ${formatBytes(usage.maxStorageBytes)}`} />
            </div>
            {row && <p className="mt-4 text-xs text-slate-500">{t('adm.detail.cases', { cases: f.number(Number(row.case_count)), open: f.number(Number(row.open_case_count)) })}</p>}
          </Card>

          {/* ------------------------------------------------ quick actions */}
          <Card title={t('adm.detail.quick')}>
            <div className="grid gap-6 sm:grid-cols-2">
              <ActionForm action={extendSubscription} submitLabel={t('adm.detail.extend')} className="space-y-3" resetOnSuccess={false} buttonClassName={secondaryBtnCls}>
                <input type="hidden" name="firm_id" value={id} />
                <Select label={t('adm.detail.addMonths')} name="months" defaultValue="1" options={EXTEND_MONTHS.map((m) => ({ value: String(m), label: t('adm.months', { n: m }) }))} hint={t('adm.detail.extendHint')} />
              </ActionForm>
              <ActionForm action={grantTrial} submitLabel={t('adm.detail.grantTrial')} className="space-y-3" resetOnSuccess={false} buttonClassName={secondaryBtnCls}>
                <input type="hidden" name="firm_id" value={id} />
                <Field label={t('adm.detail.trialDays')} name="days" type="number" min={1} max={90} defaultValue={14} dir="ltr" hint={t('adm.detail.trialHint')} />
              </ActionForm>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              {effective !== 'suspended' && effective !== 'canceled' ? (
                <form action={setSubscriptionStatus}>
                  <input type="hidden" name="firm_id" value={id} />
                  <input type="hidden" name="status" value="suspended" />
                  <ConfirmButton message={t('adm.detail.confirmSuspend')} className={dangerBtnCls}>{t('adm.detail.suspendBilling')}</ConfirmButton>
                </form>
              ) : (
                <form action={setSubscriptionStatus}>
                  <input type="hidden" name="firm_id" value={id} />
                  <input type="hidden" name="status" value="active" />
                  <button type="submit" className={secondaryBtnCls}>{t('adm.detail.reopen')}</button>
                </form>
              )}
              {effective !== 'canceled' && (
                <form action={setSubscriptionStatus}>
                  <input type="hidden" name="firm_id" value={id} />
                  <input type="hidden" name="status" value="canceled" />
                  <ConfirmButton message={t('adm.detail.confirmCancel')} className={dangerLinkCls}>{t('adm.detail.cancel')}</ConfirmButton>
                </form>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">{t('adm.detail.suspendNote')}</p>
          </Card>

          {/* ------------------------------------------------ manual edit */}
          <Card title={t('adm.detail.edit')}>
            <ActionForm action={updateSubscription} submitLabel={t('common.saveChanges')} resetOnSuccess={false}>
              <input type="hidden" name="firm_id" value={id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label={t('adm.firms.plan')} name="plan" defaultValue={sub?.plan ?? 'starter'} options={PLAN_ORDER.map((k) => ({ value: k, label: `${PLANS[k].name} · ${f.money(PLANS[k].priceMonthly * 100, 'PKR')}` }))} />
                <Select label={t('common.status')} name="status" defaultValue={sub && (MANUAL_STATUSES as readonly string[]).includes(sub.status) ? sub.status : 'active'} options={MANUAL_STATUSES.map((s) => ({ value: s, label: t(`sub.${s}` as const) }))} />
                <Field label={t('adm.detail.periodEnd')} name="period_end" type="date" defaultValue={toDateInput(sub?.current_period_end)} dir="ltr" hint={t('adm.detail.periodHint')} />
                <Field label={t('adm.detail.trialEnd')} name="trial_end" type="date" defaultValue={toDateInput(sub?.trial_ends_at)} dir="ltr" />
                <Field label={t('adm.detail.grace')} name="grace_days" type="number" min={0} max={60} defaultValue={sub?.grace_days ?? 5} dir="ltr" hint={t('adm.detail.graceHint')} />
              </div>
              <TextArea label={t('adm.detail.notes')} name="notes" rows={3} maxLength={1000} defaultValue={sub?.notes} hint={t('adm.detail.notesHint')} />
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-6">
          {/* ------------------------------------------------ account */}
          <Card title={t('adm.detail.account')}>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">{t('common.email')}</dt><dd className="break-all text-slate-900" dir="ltr">{p.email}</dd></div>
              {p.phone && <div><dt className="text-xs text-slate-500">{t('common.phone')}</dt><dd className="text-slate-900" dir="ltr">{p.phone}</dd></div>}
              <div><dt className="text-xs text-slate-500">{t('adm.detail.joined')}</dt><dd className="text-slate-900">{f.date(p.created_at)}</dd></div>
            </dl>
            <div className="mt-5 flex flex-col items-start gap-3 border-t border-slate-100 pt-4">
              {!p.password_set_at && p.is_active && (
                <SetupLinkButton action={resendLawyerInvite} id={p.id} label={mail ? t('adm.resendInvite') : t('adm.getLink')} />
              )}
              {p.mfa_enabled && (
                <form action={resetLawyerTwoFactor}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton message={t('adm.confirmReset2fa')} className={linkCls}>{t('adm.reset2fa')}</ConfirmButton>
                </form>
              )}
              <form action={setLawyerActive}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={String(!p.is_active)} />
                {p.is_active ? (
                  <ConfirmButton message={t('adm.confirmSuspendAccount')} className={dangerLinkCls}>{t('adm.suspendAccount')}</ConfirmButton>
                ) : (
                  <button type="submit" className={linkCls}>{t('adm.reactivateAccount')}</button>
                )}
              </form>
            </div>
            <p className="mt-3 text-xs text-slate-500">{t('adm.suspendAccountNote')}</p>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------ payments */}
      <div className="mt-6">
        <Card title={t('adm.detail.payments')} padded={false} action={<Link href={`/admin/billing?tab=history&firm=${p.id}`} className={linkCls}>{t('adm.dash.viewAll')}</Link>}>
          {payments.length === 0 ? (
            <EmptyState compact kind="invoices" title={t('adm.detail.noPayments')} />
          ) : (
            <Table>
              <THead>
                <Th>{t('common.date')}</Th><Th>{t('adm.firms.plan')}</Th><Th>{t('common.amount')}</Th>
                <Th>{t('adm.pay.reference')}</Th><Th>{t('common.status')}</Th><Th><span className="sr-only">{t('adm.pay.proof')}</span></Th>
              </THead>
              <TBody>
                {payments.map((x) => (
                  <Tr key={x.id}>
                    <Td label={t('common.date')} className="whitespace-nowrap">{f.date(x.created_at)}</Td>
                    <Td label={t('adm.firms.plan')}>{getPlan(x.plan).name} · {t('adm.months', { n: x.months })}</Td>
                    <Td label={t('common.amount')} className="whitespace-nowrap"><span dir="ltr">{f.money(x.amount_cents, x.currency)}</span></Td>
                    <Td label={t('adm.pay.reference')}><span dir="ltr">{x.reference ?? '—'}</span>{x.review_note && <p className="text-xs text-slate-500">{x.review_note}</p>}</Td>
                    <Td label={t('common.status')}><PayStatusBadge status={x.status} /></Td>
                    <Td label="" className="text-end">{x.proof_path && <a href={`/api/payments/${x.id}/proof`} target="_blank" rel="noopener noreferrer" className={linkCls}>{t('adm.pay.proof')}</a>}</Td>
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
