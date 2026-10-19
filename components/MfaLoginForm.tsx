'use client'

import { useActionState } from 'react'
import { verifyLoginMfa } from '@/app/actions/mfa'
import { logout } from '@/app/actions/auth'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls, linkCls } from './ui'

export default function MfaLoginForm({ next }: { next?: string }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(verifyLoginMfa, undefined)
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="code" className={labelCls}>{t('auth.mfaCode')}</label>
          <input
            id="code" name="code" inputMode="numeric" dir="ltr" autoComplete="one-time-code" pattern="[0-9 ]*"
            maxLength={7} required autoFocus placeholder="123456"
            className={`${inputCls} text-center font-mono text-xl tracking-[0.35em]`}
          />
        </div>
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
          {pending ? t('auth.mfaVerifying') : t('auth.mfaVerify')}
        </button>
      </form>
      <form action={logout} className="text-center">
        <button type="submit" className={linkCls}>{t('auth.otherAccount')}</button>
      </form>
    </div>
  )
}
