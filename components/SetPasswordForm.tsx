'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, hintCls, inputCls, labelCls } from './ui'

// needTerms: first-time users must accept the Terms and Privacy Policy
export default function SetPasswordForm({ needTerms }: { needTerms: boolean }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(updatePassword, undefined)
  const [before, mid, after] = t('auth.agree', { terms: '\u0001', privacy: '\u0002' }).split(/[\u0001\u0002]/)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className={labelCls}>{t('auth.newPassword')}</label>
        <input id="password" name="password" type="password" dir="ltr" autoComplete="new-password" minLength={10} maxLength={72} required className={inputCls} />
        <p className={hintCls}>{t('auth.passwordHint')}</p>
      </div>
      <div>
        <label htmlFor="confirm" className={labelCls}>{t('auth.confirmPassword')}</label>
        <input id="confirm" name="confirm" type="password" dir="ltr" autoComplete="new-password" minLength={10} maxLength={72} required className={inputCls} />
      </div>
      {needTerms && (
        <label className="flex items-start gap-2.5 text-sm text-slate-700">
          <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 rounded border-slate-300 accent-[var(--color-gold-600)]" />
          <span>
            {before}
            <Link href="/terms" target="_blank" className="font-medium underline">{t('auth.terms')}</Link>
            {mid}
            <Link href="/privacy" target="_blank" className="font-medium underline">{t('auth.privacy')}</Link>
            {after}
          </span>
        </label>
      )}
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
        {pending ? t('common.saving') : t('auth.savePassword')}
      </button>
    </form>
  )
}
