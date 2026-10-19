'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck } from 'lucide-react'
import { beginMfaEnroll, confirmMfaEnroll, disableMfa } from '@/app/actions/mfa'
import ActionForm from './ActionForm'
import Card from './Card'
import { Badge } from './BadgeBase'
import { useI18n } from './I18nProvider'
import { buttonCls, dangerBtnCls, inputCls, labelCls } from './ui'

function CodeField({ id = 'code' }: { id?: string }) {
  const { t } = useI18n()
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{t('mfa.code6')}</label>
      <input
        id={id} name="code" inputMode="numeric" dir="ltr" autoComplete="one-time-code" pattern="[0-9 ]*"
        maxLength={7} required placeholder="123456" className={`${inputCls} max-w-[11rem] text-center font-mono text-lg tracking-widest`}
      />
    </div>
  )
}

export default function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const { t } = useI18n()
  const [setup, setSetup] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()

  function start() {
    setError(undefined)
    startTransition(async () => {
      const res = await beginMfaEnroll()
      if (res.error || !res.factorId || !res.qr || !res.secret) {
        setError(res.error ?? t('msg.mfa.startFail'))
        return
      }
      setSetup({ factorId: res.factorId, qr: res.qr, secret: res.secret })
    })
  }

  return (
    <Card title={t('mfa.title')}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900">{t('mfa.authApp')}</p>
          <div className="mt-0.5">{enabled ? <Badge tone="green">{t('mfa.on')}</Badge> : <Badge>{t('mfa.off')}</Badge>}</div>
        </div>
      </div>

      {enabled ? (
        <>
          <p className="mb-4 text-sm text-slate-600">{t('mfa.enabledText')}</p>
          <ActionForm action={disableMfa} submitLabel={t('mfa.turnOff')} pendingLabel={t('mfa.turningOff')} buttonClassName={dangerBtnCls}>
            <CodeField id="disable-code" />
          </ActionForm>
        </>
      ) : setup ? (
        <div className="space-y-4">
          <ol className="list-decimal space-y-1 ps-5 text-sm text-slate-600">
            <li>{t('mfa.step1')}</li>
            <li>{t('mfa.step2')}</li>
            <li>{t('mfa.step3')}</li>
          </ol>
          <div className="flex flex-wrap items-center gap-5">
            {/* QR codes are always dark-on-white so they scan in dark mode too */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt={t('mfa.qrAlt')} width={168} height={168} className="rounded-lg border border-slate-200 bg-white p-2" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{t('mfa.setupKey')}</p>
              <p className="mt-1 break-all font-mono text-sm text-slate-900" dir="ltr">{setup.secret}</p>
            </div>
          </div>
          <ActionForm action={confirmMfaEnroll} submitLabel={t('mfa.verifyOn')} pendingLabel={t('auth.mfaVerifying')} resetOnSuccess>
            <input type="hidden" name="factor_id" value={setup.factorId} />
            <CodeField id="enroll-code" />
          </ActionForm>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">{t('mfa.intro')}</p>
          {error && <p role="alert" className="mb-3 rounded-lg border border-alert-200 bg-alert-50 px-3.5 py-2.5 text-sm text-alert-700">{error}</p>}
          <button type="button" onClick={start} disabled={pending} className={buttonCls}>
            {pending ? t('mfa.preparing') : t('mfa.setUp')}
          </button>
        </>
      )}
    </Card>
  )
}
