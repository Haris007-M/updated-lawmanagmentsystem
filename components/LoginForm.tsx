'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls, linkCls } from './ui'

export default function LoginForm() {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelCls}>{t('auth.email')}</label>
        <input id="email" name="email" type="email" dir="ltr" autoComplete="email" required defaultValue={state?.fields?.email} className={inputCls} />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>{t('auth.password')}</label>
        <input id="password" name="password" type="password" dir="ltr" autoComplete="current-password" required className={inputCls} />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
        {pending ? t('auth.signingIn') : t('auth.signIn')}
      </button>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className={linkCls}>{t('auth.forgot')}</Link>
      </p>
    </form>
  )
}
