/* eslint-disable @next/next/no-html-link-for-pages -- the export links are file downloads, not pages */
import { Download } from 'lucide-react'
import { updateFirmPrefs, updateFirmSettings } from '@/app/lawyer/firm-actions'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import { Field, Select, TextArea } from '@/components/Field'
import PageHeader from '@/components/PageHeader'
import SettingsPanel from '@/components/SettingsPanel'
import { secondaryBtnCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { CURRENCIES } from '@/lib/constants'
import { getI18n } from '@/lib/i18n'
import { loadFirmPrefs, loadFirmSettings } from '@/lib/lawyer-b-data'
import { createClient } from '@/lib/supabase/server'

export default async function LawyerSettingsPage() {
  const { t } = await getI18n()
  const me = await requireStaff()
  if (me.role !== 'lawyer') {
    return (
      <>
        <PageHeader title={t('lb.set.title')} description={t('lb.set.juniorDesc')} />
        <SettingsPanel profile={me} />
      </>
    )
  }

  const sb = await createClient()
  const [firm, prefs] = await Promise.all([loadFirmSettings(sb, me.firm_id), loadFirmPrefs(sb, me.firm_id)])
  const exports: { kind: string; label: string }[] = [
    { kind: 'clients', label: t('lb.set.exp.clients') },
    { kind: 'cases', label: t('lb.set.exp.cases') },
    { kind: 'invoices', label: t('lb.set.exp.invoices') },
    { kind: 'time', label: t('lb.set.exp.time') },
  ]

  return (
    <>
      <PageHeader title={t('lb.set.title')} description={t('lb.set.desc')} />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title={t('lb.set.firm')}>
          <ActionForm action={updateFirmSettings} submitLabel={t('lb.set.saveFirm')} resetOnSuccess={false}>
            <Field label={t('lb.set.firmName')} name="firm_name" defaultValue={firm?.firm_name ?? me.firm_name} maxLength={160} />
            <TextArea label={t('lb.set.address')} name="address" rows={2} defaultValue={firm?.address} maxLength={400} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('lb.set.phone')} name="phone" type="tel" dir="ltr" defaultValue={firm?.phone} maxLength={60} />
              <Field label={t('lb.set.email')} name="email" type="email" dir="ltr" defaultValue={firm?.email} maxLength={160} />
            </div>
            <Field label={t('lb.set.ntn')} name="ntn" dir="ltr" defaultValue={firm?.ntn} maxLength={60} />
            <TextArea label={t('lb.set.bank')} name="bank_details" rows={3} defaultValue={firm?.bank_details} maxLength={1000} hint={t('lb.set.bankHint')} />
            <TextArea label={t('lb.set.terms')} name="invoice_terms" rows={3} defaultValue={firm?.invoice_terms} maxLength={1000} />
            <TextArea label={t('lb.set.footer')} name="letter_footer" rows={2} defaultValue={firm?.letter_footer} maxLength={500} hint={t('lb.set.footerHint')} />
          </ActionForm>
        </Card>

        <div className="space-y-6">
          <Card title={t('lb.set.prefs')}>
            <ActionForm action={updateFirmPrefs} submitLabel={t('lb.set.savePrefs')} resetOnSuccess={false}>
              <Field
                label={t('lb.set.rate')} name="hourly_rate" type="number" dir="ltr" min={0} step="0.01"
                defaultValue={(prefs.hourly_rate_cents / 100).toString()} hint={t('lb.set.rateHint')}
              />
              <Select
                label={t('lb.set.currency')} name="default_currency" defaultValue={prefs.default_currency}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
              <Field label={t('lb.set.dueDays')} name="default_due_days" type="number" dir="ltr" min={0} max={365} defaultValue={prefs.default_due_days} />
            </ActionForm>
          </Card>

          <Card title={t('lb.set.export')}>
            <p className="mb-3 text-sm text-slate-600">{t('lb.set.exportHint')}</p>
            <div className="flex flex-wrap gap-2">
              {exports.map((e) => (
                <a key={e.kind} href={`/api/export/${e.kind}`} className={secondaryBtnCls}>
                  <Download className="size-4" aria-hidden /> {e.label}
                </a>
              ))}
              <a href="/api/export/all" className={secondaryBtnCls}>
                <Download className="size-4" aria-hidden /> {t('lb.set.exp.all')}
              </a>
            </div>
          </Card>
        </div>
      </div>

      <h2 className="mb-3 text-base font-semibold text-brand-900">{t('lb.set.account')}</h2>
      <SettingsPanel profile={me} />
    </>
  )
}
