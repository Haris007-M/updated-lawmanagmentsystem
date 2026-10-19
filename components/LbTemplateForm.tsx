import ActionForm from './ActionForm'
import { Field, Select, TextArea } from './Field'
import { saveTemplate } from '@/app/lawyer/billing-actions'
import { CURRENCIES } from '@/lib/constants'
import Link from 'next/link'
import { centsToInput } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { TEMPLATE_VARS } from '@/lib/lawyer-b-templates'
import type { TemplateRow } from '@/lib/types'

export default async function LbTemplateForm({ kind, template }: { kind: 'letter' | 'invoice'; template?: TemplateRow }) {
  const { t } = await getI18n()
  const back = `/lawyer/templates${kind === 'invoice' ? '?tab=invoice' : ''}`
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <ActionForm action={saveTemplate} submitLabel={t('common.save')} resetOnSuccess={false}
        footer={<Link href={back} className="text-sm font-medium text-slate-600 hover:underline">{t('common.cancel')}</Link>}>
        <input type="hidden" name="kind" value={kind} />
        {template && <input type="hidden" name="id" value={template.id} />}
        <Field label={t('lb.tpl.name')} name="name" required maxLength={120} defaultValue={template?.name} />
        <TextArea label={kind === 'letter' ? t('lb.tpl.bodyLetter') : t('lb.tpl.bodyInvoice')} name="body" rows={kind === 'letter' ? 16 : 5}
          required maxLength={20000} defaultValue={template?.body} hint={t('lb.tpl.bodyHint')} />
        {kind === 'invoice' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('lb.tpl.amount')} name="amount" dir="ltr" defaultValue={template?.amount_cents ? centsToInput(template.amount_cents) : ''} hint={t('lb.tpl.amountHint')} />
            <Select label={t('lb.bill.currency')} name="currency" defaultValue={template?.currency ?? 'PKR'} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </div>
        )}
      </ActionForm>
      <aside aria-label={t('lb.tpl.placeholders')} className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <h3 className="text-xs font-semibold text-slate-600">{t('lb.tpl.placeholders')}</h3>
        <p className="mt-1 text-xs text-slate-500">{t('lb.tpl.placeholdersHint')}</p>
        <ul className="mt-3 space-y-1.5" dir="ltr">
          {TEMPLATE_VARS.map((v) => <li key={v}><code className="rounded bg-surface px-1.5 py-0.5 text-xs text-slate-700">{`{{${v}}}`}</code></li>)}
        </ul>
      </aside>
    </div>
  )
}
