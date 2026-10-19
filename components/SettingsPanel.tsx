import { changePassword, updateProfile } from '@/app/actions/account'
import { getI18n } from '@/lib/i18n'
import type { Profile } from '@/lib/types'
import ActionForm from './ActionForm'
import Card from './Card'
import { Checkbox, Field } from './Field'
import LanguageSwitch from './LanguageSwitch'
import TwoFactorCard from './TwoFactorCard'
import { hintCls, inputCls, labelCls } from './ui'

// Own-account settings, shared by admin, lawyer, junior and client portals.
export default async function SettingsPanel({ profile }: { profile: Profile }) {
  const { t } = await getI18n()
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title={t('settings.profile')}>
        <ActionForm action={updateProfile} submitLabel={t('settings.saveProfile')} resetOnSuccess={false}>
          <div>
            <label htmlFor="own-email" className={labelCls}>{t('settings.email')}</label>
            <input id="own-email" value={profile.email} disabled readOnly dir="ltr" className={`${inputCls} bg-slate-50 text-slate-500`} />
            <p className={hintCls}>{t('settings.roleNote', { role: t(`role.${profile.role}` as const) })}</p>
          </div>
          <Field label={t('settings.fullName')} name="full_name" required defaultValue={profile.full_name} />
          <Field label={t('settings.phone')} name="phone" type="tel" defaultValue={profile.phone} />
          {profile.role === 'lawyer' && (
            <Field label={t('settings.firmName')} name="firm_name" defaultValue={profile.firm_name} hint={t('settings.firmNameHint')} />
          )}
          <Checkbox name="notify_email" label={t('settings.notify')} defaultChecked={profile.notify_email} />
        </ActionForm>
      </Card>

      <div className="space-y-6">
        <TwoFactorCard enabled={profile.mfa_enabled} />
        <Card title={t('settings.language')}>
          <p className="mb-3 text-sm text-slate-600">{t('settings.languageHint')}</p>
          <LanguageSwitch variant="light" />
        </Card>
      </div>

      <Card title={t('settings.changePassword')}>
        <ActionForm action={changePassword} submitLabel={t('settings.updatePassword')}>
          <Field label={t('settings.currentPassword')} name="current" type="password" required />
          <Field label={t('auth.newPassword')} name="password" type="password" required hint={t('auth.passwordHint')} />
          <Field label={t('settings.confirmNew')} name="confirm" type="password" required />
        </ActionForm>
      </Card>
    </div>
  )
}
