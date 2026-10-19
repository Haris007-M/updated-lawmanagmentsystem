'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset } from '@/app/actions/auth'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls, linkCls } from './ui'

export default function ForgotPasswordForm() {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelCls}>{t('auth.email')}</label>
        <input id="email" name="email" type="email" dir="ltr" autoComplete="email" required className={inputCls} />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
        {pending ? t('common.sending') : t('auth.sendReset')}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className={linkCls}>{t('auth.backToSignIn')}</Link>
      </p>
    </form>
  )
}
