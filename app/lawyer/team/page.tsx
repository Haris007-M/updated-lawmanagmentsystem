import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { inviteJunior, resendJuniorInvite, resetJuniorTwoFactor, setJuniorActive } from '@/app/lawyer/firm-actions'
import { AccountStatusBadge } from '@/components/Badge'
import Card from '@/components/Card'
import ConfirmButton from '@/components/ConfirmButton'
import EmptyState from '@/components/EmptyState'
import InviteForm from '@/components/InviteForm'
import LbUsageMeter from '@/components/LbUsageMeter'
import PageHeader from '@/components/PageHeader'
import SetupLinkButton from '@/components/SetupLinkButton'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { dangerLinkCls, linkCls } from '@/components/ui'
import { requireOwner } from '@/lib/auth'
import { formatBytes } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { firmUsage } from '@/lib/limits'
import { createClient } from '@/lib/supabase/server'
import { getPlan } from '@/lib/plans'

interface Junior { id: string; full_name: string | null; email: string; is_active: boolean; password_set_at: string | null; mfa_enabled: boolean; created_at: string }

export default async function TeamPage() {
  const me = await requireOwner()
  const { t, f } = await getI18n()
  const sb = await createClient()
  const [{ data }, usage] = await Promise.all([
    sb.from('profiles').select('id, full_name, email, is_active, password_set_at, mfa_enabled, created_at').eq('role', 'junior').order('created_at'),
    firmUsage(me.firm_id),
  ])
  const juniors = (data ?? []) as Junior[]
  const full = usage.juniors >= usage.maxJuniors
  const can = ['lb.team.can1', 'lb.team.can2', 'lb.team.can3', 'lb.team.can4'] as const
  const cannot = ['lb.team.cannot1', 'lb.team.cannot2', 'lb.team.cannot3', 'lb.team.cannot4'] as const

  return (
    <>
      <PageHeader title={t('nav.team')} description={t('lb.team.subtitle')} />

      <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          {full ? (
            <Card>
              <p className="text-sm text-slate-700">{t('lb.team.full', { plan: getPlan(usage.plan).name })}</p>
              <Link href="/lawyer/subscription" className={`${linkCls} mt-2 inline-block`}>{t('lb.team.upgrade')}</Link>
            </Card>
          ) : (
            <InviteForm action={inviteJunior} heading={t('lb.team.invite')} buttonLabel={t('lb.team.inviteBtn')} />
          )}
        </div>
        <Card title={t('lb.team.usage')}>
          <div className="space-y-4">
            <LbUsageMeter label={t('lb.team.juniors')} used={usage.juniors} max={usage.maxJuniors} usedText={f.number(usage.juniors)} maxText={f.number(usage.maxJuniors)} />
            <LbUsageMeter label={t('lb.team.clients')} used={usage.clients} max={usage.maxClients} usedText={f.number(usage.clients)} maxText={f.number(usage.maxClients)} />
            <LbUsageMeter label={t('lb.team.storage')} used={usage.storageBytes} max={usage.maxStorageBytes} usedText={formatBytes(usage.storageBytes)} maxText={formatBytes(usage.maxStorageBytes)} />
          </div>
        </Card>
      </div>

      <Card padded={false} className="mb-6" title={t('lb.team.members')}>
        {juniors.length === 0 ? (
          <EmptyState kind="team" title={t('lb.team.none')} hint={t('lb.team.noneHint')} />
        ) : (
          <Table>
            <THead><Th>{t('common.name')}</Th><Th>{t('common.email')}</Th><Th>{t('common.status')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th></THead>
            <TBody>
              {juniors.map((j) => (
                <Tr key={j.id}>
                  <Td label={t('common.name')} className="font-medium text-slate-900">{j.full_name ?? '—'}</Td>
                  <Td label={t('common.email')}><span dir="ltr">{j.email}</span></Td>
                  <Td label={t('common.status')}><AccountStatusBadge isActive={j.is_active} passwordSetAt={j.password_set_at} mfaEnabled={j.mfa_enabled} /></Td>
                  <Td label="">
                    <div className="flex flex-wrap items-start justify-end gap-x-4 gap-y-2">
                      {!j.password_set_at && j.is_active && <SetupLinkButton action={resendJuniorInvite} id={j.id} label={t('lb.team.resend')} />}
                      {j.mfa_enabled && (
                        <form action={resetJuniorTwoFactor}><input type="hidden" name="id" value={j.id} />
                          <ConfirmButton message={t('lb.team.confirmReset2fa')} className={linkCls}>{t('lb.team.reset2fa')}</ConfirmButton></form>
                      )}
                      <form action={setJuniorActive}>
                        <input type="hidden" name="id" value={j.id} />
                        <input type="hidden" name="active" value={String(!j.is_active)} />
                        {j.is_active
                          ? <ConfirmButton message={t('lb.team.confirmSuspend')} className={dangerLinkCls}>{t('lb.team.suspend')}</ConfirmButton>
                          : <button type="submit" className={linkCls}>{t('lb.team.reactivate')}</button>}
                      </form>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card title={t('lb.team.whatTitle')}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('lb.team.canTitle')}</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {can.map((k) => <li key={k} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{t(k)}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('lb.team.cannotTitle')}</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {cannot.map((k) => <li key={k} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-alert-700" aria-hidden />{t(k)}</li>)}
            </ul>
          </div>
        </div>
      </Card>
    </>
  )
}
