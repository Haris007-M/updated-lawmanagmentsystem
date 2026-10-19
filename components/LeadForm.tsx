'use client'

import { useActionState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { submitLead } from '@/app/actions/leads'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls } from './ui'

export default function LeadForm({ defaultPlan = '' }: { defaultPlan?: string }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(submitLead, undefined)
  const f = state?.fields ?? {}

  if (state?.success) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
        <h2 className="mt-4 font-display text-xl font-semibold text-slate-900">{t('site.contact.ok.title')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('site.contact.ok.text')}</p>
        <Link href="/" className="mt-5 inline-block text-sm font-medium text-brand-700 underline">{t('nav.home')}</Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4" noValidate={false}>
      {/* honeypot: hidden from people, bots fill it */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className={labelCls}>{t('site.contact.name')}</label>
          <input id="lead-name" name="name" required maxLength={120} autoComplete="name" defaultValue={f.name} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lead-firm" className={labelCls}>{t('site.contact.firm')}</label>
          <input id="lead-firm" name="firm" maxLength={160} autoComplete="organization" defaultValue={f.firm} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lead-phone" className={labelCls}>{t('site.contact.phone')}</label>
          <input id="lead-phone" name="phone" type="tel" dir="ltr" maxLength={40} autoComplete="tel" defaultValue={f.phone} placeholder="0300 1234567" className={inputCls} />
        </div>
        <div>
          <label htmlFor="lead-email" className={labelCls}>{t('site.contact.email')}</label>
          <input id="lead-email" name="email" type="email" dir="ltr" maxLength={254} autoComplete="email" defaultValue={f.email} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lead-city" className={labelCls}>{t('site.contact.city')}</label>
          <input id="lead-city" name="city" maxLength={80} autoComplete="address-level2" defaultValue={f.city} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lead-plan" className={labelCls}>{t('site.contact.plan')}</label>
          <select key={`pl-${f.plan ?? ""}`} id="lead-plan" name="plan" defaultValue={f.plan ?? defaultPlan} className={inputCls}>
            <option value="">{t('site.contact.planAny')}</option>
            {PLAN_ORDER.map((id) => <option key={id} value={id}>{PLANS[id].name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="lead-message" className={labelCls}>{t('site.contact.message')}</label>
        <textarea id="lead-message" name="message" rows={3} maxLength={1500} defaultValue={f.message} className={inputCls} />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 rounded border-slate-300 accent-gold-600" />
        <span>{t('site.contact.consent')} <Link href="/privacy" target="_blank" className="font-medium underline">{t('auth.privacy')}</Link></span>
      </label>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonCls} w-full sm:w-auto`}>
        {pending ? t('site.contact.sending') : t('site.contact.submit')}
      </button>
    </form>
  )
}
