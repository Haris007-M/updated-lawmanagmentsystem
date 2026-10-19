'use client'

import { useActionState } from 'react'
import { confirmPayment, rejectPayment } from '@/app/admin/actions'
import ConfirmButton from '@/components/ConfirmButton'
import FormMessage from '@/components/FormMessage'
import { useI18n } from '@/components/I18nProvider'
import { buttonCls, inputCls, labelCls, secondaryBtnCls } from '@/components/ui'

// Confirm (adds the paid months to the subscription) or reject with a reason the firm will see.
export default function PaymentActions({ id, summary }: { id: string; summary: string }) {
  const { t } = useI18n()
  const [okState, okAction, okPending] = useActionState(confirmPayment, undefined)
  const [noState, noAction, noPending] = useActionState(rejectPayment, undefined)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <form action={okAction}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" disabled={okPending} className={buttonCls} onClick={(e) => { if (!window.confirm(t('adm.pay.confirmAsk', { summary }))) e.preventDefault() }}>
            {okPending ? t('common.saving') : t('adm.pay.confirm')}
          </button>
        </form>
        <details className="min-w-[14rem] flex-1">
          <summary className={`${secondaryBtnCls} cursor-pointer list-none`}>{t('adm.pay.reject')}</summary>
          <form action={noAction} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
            <input type="hidden" name="id" value={id} />
            <div>
              <label htmlFor={`reason-${id}`} className={labelCls}>{t('adm.pay.reason')}</label>
              <textarea id={`reason-${id}`} name="reason" rows={2} required maxLength={500} placeholder={t('adm.pay.reasonPlaceholder')} className={inputCls} />
            </div>
            <ConfirmButton message={t('adm.pay.rejectAsk')} className={secondaryBtnCls}>{noPending ? t('common.saving') : t('adm.pay.reject')}</ConfirmButton>
          </form>
        </details>
      </div>
      <FormMessage state={okState ?? noState} />
    </div>
  )
}
