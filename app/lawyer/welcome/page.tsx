import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import { Field, Select, TextArea } from '@/components/Field'
import Logo from '@/components/Logo'
import { requireOwner } from '@/lib/auth'
import { CURRENCIES } from '@/lib/constants'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { completeWelcome } from '../actions'

export default async function WelcomePage() {
  const me = await requireOwner({ allowUnonboarded: true })
  const { t } = await getI18n()
  const supabase = await createClient()
  const [{ data: settings }, { data: prefs }] = await Promise.all([
    supabase.from('firm_settings').select('firm_name, phone, address').eq('firm_id', me.id).maybeSingle(),
    supabase.from('firm_prefs').select('default_currency, hourly_rate_cents, default_due_days').eq('firm_id', me.id).maybeSingle(),
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-5 font-display text-3xl font-semibold text-brand-900">{t('la.welcome.title')}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t('la.welcome.intro')}</p>
      </div>

      <Card>
        <ActionForm action={completeWelcome} submitLabel={t('la.welcome.finish')} pendingLabel={t('common.saving')}>
          <h2 className="text-sm font-semibold text-slate-900">{t('la.welcome.firmSection')}</h2>
          <Field label={t('la.welcome.firmName')} name="firm_name" required maxLength={160} defaultValue={settings?.firm_name ?? me.firm_name ?? ''} />
          <Field label={t('common.phone')} name="phone" type="tel" dir="ltr" maxLength={40} defaultValue={settings?.phone ?? me.phone ?? ''} hint={t('la.welcome.phoneHint')} />
          <TextArea label={t('la.welcome.address')} name="address" rows={3} maxLength={400} defaultValue={settings?.address ?? ''} hint={t('la.welcome.addressHint')} />

          <h2 className="pt-2 text-sm font-semibold text-slate-900">{t('la.welcome.billingSection')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label={t('la.welcome.currency')} name="currency" defaultValue={prefs?.default_currency ?? 'PKR'} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
            <Field label={t('la.welcome.rate')} name="hourly_rate" dir="ltr" defaultValue={prefs?.hourly_rate_cents ? (prefs.hourly_rate_cents / 100).toFixed(2) : ''} />
            <Field label={t('la.welcome.dueDays')} name="due_days" dir="ltr" defaultValue={String(prefs?.default_due_days ?? 14)} />
          </div>
          <p className="text-xs text-slate-500">{t('la.welcome.billingHint')}</p>
        </ActionForm>
      </Card>
      <p className="mt-4 text-center text-xs text-slate-500">{t('la.welcome.later')} <Link href="/lawyer/settings" className="underline">{t('nav.settings')}</Link></p>
    </div>
  )
}
