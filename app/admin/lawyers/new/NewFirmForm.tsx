'use client'

import { useActionState } from 'react'
import { inviteLawyer } from '@/app/admin/actions'
import FormMessage from '@/components/FormMessage'
import LinkPanel from '@/components/LinkPanel'
import { useI18n } from '@/components/I18nProvider'
import { buttonCls, cardCls, inputCls, labelCls } from '@/components/ui'

// Create a lawyer (firm owner). Defaults can come from a lead (?name=&email=&firm=).
export default function NewFirmForm({ defaults }: { defaults: { name: string; email: string; firm: string } }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(inviteLawyer, undefined)
  const v = state?.fields

  return (
    <form action={action} className={`${cardCls} p-5`}>
      <h2 className="text-sm font-semibold tracking-tight text-brand-900">{t('adm.new.heading')}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className={labelCls}>{t('invite.fullName')}</label>
          <input id="full_name" name="full_name" required defaultValue={v?.full_name ?? defaults.name} className={inputCls} />
        </div>
        <div>
          <label htmlFor="invite_email" className={labelCls}>{t('common.email')}</label>
          <input id="invite_email" name="email" type="email" dir="ltr" required defaultValue={v?.email ?? defaults.email} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="firm_name" className={labelCls}>{t('settings.firmName')} <span className="font-normal text-slate-400">({t('common.optional')})</span></label>
          <input id="firm_name" name="firm_name" maxLength={160} defaultValue={v?.firm_name ?? defaults.firm} className={inputCls} />
        </div>
      </div>
      <div className="mt-3 space-y-3">
        <FormMessage state={state} />
        {state?.link && <LinkPanel link={state.link} />}
        <button type="submit" disabled={pending} className={buttonCls}>{pending ? t('invite.creating') : t('adm.new.button')}</button>
      </div>
    </form>
  )
}
