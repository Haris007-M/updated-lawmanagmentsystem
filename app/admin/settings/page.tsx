import PageHeader from '@/components/PageHeader'
import SettingsPanel from '@/components/SettingsPanel'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import { Field, TextArea } from '@/components/Field'
import { requireRole } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import type { PlatformSettings } from '@/lib/types'
import { savePlatformSettings } from '../actions'

export default async function AdminSettingsPage() {
  const me = await requireRole('super_admin')
  const { t } = await getI18n()
  const { data } = await createClient().then((s) => s.from('platform_settings').select('*').eq('id', 1).maybeSingle())
  const s = data as PlatformSettings | null

  return (
    <>
      <PageHeader title={t('nav.settings')} description={t('adm.settings.desc')} />
      <div className="space-y-6">
        <Card title={t('adm.settings.bank')}>
          <p className="mb-4 text-sm text-slate-600">{t('adm.settings.bankHint')}</p>
          <ActionForm action={savePlatformSettings} submitLabel={t('common.saveChanges')} resetOnSuccess={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('adm.settings.bankName')} name="bank_name" defaultValue={s?.bank_name} maxLength={120} />
              <Field label={t('adm.settings.accountTitle')} name="account_title" defaultValue={s?.account_title} maxLength={120} />
              <Field label={t('adm.settings.accountNumber')} name="account_number" defaultValue={s?.account_number} maxLength={60} dir="ltr" />
              <Field label={t('adm.settings.iban')} name="iban" defaultValue={s?.iban} maxLength={60} dir="ltr" />
              <Field label={t('adm.settings.branch')} name="branch" defaultValue={s?.branch} maxLength={120} />
              <Field label={t('adm.settings.supportWhatsapp')} name="support_whatsapp" type="tel" defaultValue={s?.support_whatsapp} maxLength={30} dir="ltr" hint={t('adm.settings.waHint')} />
              <Field label={t('adm.settings.supportEmail')} name="support_email" type="email" defaultValue={s?.support_email} maxLength={120} dir="ltr" />
            </div>
            <TextArea label={t('adm.settings.instructions')} name="payment_instructions" rows={4} maxLength={1500} defaultValue={s?.payment_instructions} hint={t('adm.settings.instructionsHint')} />
            <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <Field label={t('adm.settings.trialDays')} name="trial_days" type="number" min={0} max={90} defaultValue={s?.trial_days ?? 14} dir="ltr" hint={t('adm.settings.trialHint')} />
              <Field label={t('adm.settings.graceDays')} name="grace_days" type="number" min={0} max={60} defaultValue={s?.grace_days ?? 5} dir="ltr" hint={t('adm.settings.graceHint')} />
            </div>
          </ActionForm>
        </Card>

        <h2 className="font-display text-xl font-semibold text-brand-900">{t('adm.settings.account')}</h2>
        <SettingsPanel profile={me} />
      </div>
    </>
  )
}
