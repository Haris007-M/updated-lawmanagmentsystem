'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { preparePaymentProof, submitPayment } from '@/app/lawyer/billing-actions'
import { createClient } from '@/lib/supabase/client'
import { MAX_PROOF_BYTES, PROOF_BUCKET } from '@/lib/constants'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, hintCls, inputCls, labelCls } from './ui'

export interface PlanChoice { id: string; name: string; prices: Record<number, number> } // prices in whole PKR per months option

// "I have paid" form: the bank transfer receipt goes straight to private storage; the amount is recomputed on the server.
export default function LbPaymentForm({ plans, months, defaultPlan, today }: { plans: PlanChoice[]; months: number[]; defaultPlan: string; today: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [plan, setPlan] = useState(plans.some((p) => p.id === defaultPlan) ? defaultPlan : plans[0].id)
  const [m, setM] = useState(months[0])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ error?: string; success?: string }>()
  const price = plans.find((p) => p.id === plan)?.prices[m] ?? 0
  const mb = Math.round(MAX_PROOF_BYTES / 1024 / 1024)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const file = fd.get('proof')
    setBusy(true)
    setMsg(undefined)
    try {
      let proofPath: string | undefined
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_PROOF_BYTES) return setMsg({ error: t('lb.sub.err.proofSize', { mb }) })
        const prep = await preparePaymentProof({ fileName: file.name, size: file.size })
        if (prep.error || !prep.path || !prep.token) return setMsg({ error: prep.error ?? t('doc.err.uploadFail') })
        const { error } = await createClient().storage.from(PROOF_BUCKET).uploadToSignedUrl(prep.path, prep.token, file, { contentType: prep.contentType })
        if (error) return setMsg({ error: t('doc.err.uploadFail') })
        proofPath = prep.path
      }
      const res = await submitPayment({
        plan, months: m, reference: String(fd.get('reference') ?? ''), paidOn: String(fd.get('paid_on') ?? ''),
        note: String(fd.get('note') ?? ''), proofPath,
      })
      if (res.error) return setMsg({ error: res.error })
      setMsg({ success: res.success })
      form.reset()
      router.refresh()
    } catch {
      setMsg({ error: t('lb.err.generic') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pay-plan" className={labelCls}>{t('lb.sub.plan')}</label>
          <select id="pay-plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls}>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pay-months" className={labelCls}>{t('lb.sub.months')}</label>
          <select id="pay-months" value={m} onChange={(e) => setM(Number(e.target.value))} className={inputCls}>
            {months.map((x) => <option key={x} value={x}>{t('lb.sub.monthsN', { n: x })}</option>)}
          </select>
        </div>
      </div>
      <p className="rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-800">
        {t('lb.sub.amountToPay')}: <strong className="text-base" dir="ltr">PKR {price.toLocaleString('en-US')}</strong>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pay-ref" className={labelCls}>{t('lb.sub.reference')}</label>
          <input id="pay-ref" name="reference" required maxLength={120} dir="ltr" className={inputCls} />
          <p className={hintCls}>{t('lb.sub.referenceHint')}</p>
        </div>
        <div>
          <label htmlFor="pay-date" className={labelCls}>{t('lb.sub.paidOn')}</label>
          <input id="pay-date" name="paid_on" type="date" defaultValue={today} max={today} dir="ltr" className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="pay-proof" className={labelCls}>{t('lb.sub.proof')}</label>
        <input id="pay-proof" name="proof" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="block w-full text-sm text-slate-700 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-100" />
        <p className={hintCls}>{t('lb.sub.proofHint', { mb })}</p>
      </div>
      <div>
        <label htmlFor="pay-note" className={labelCls}>{t('common.notes')} <span className="font-normal text-slate-400">({t('common.optional')})</span></label>
        <input id="pay-note" name="note" maxLength={500} className={inputCls} />
      </div>
      <FormMessage state={msg} />
      <button type="submit" disabled={busy} className={buttonCls}>{busy ? t('common.sending') : t('lb.sub.submit')}</button>
    </form>
  )
}
