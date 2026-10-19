import Link from 'next/link'
import ActionForm from './ActionForm'
import { Field, Select, TextArea } from './Field'
import { centsToInput } from '@/lib/format'
import { CURRENCIES } from '@/lib/constants'
import { getI18n } from '@/lib/i18n'
import { createInvoice, updateInvoice } from '@/app/lawyer/billing-actions'
import type { CaseOpt, PersonOpt } from '@/lib/lawyer-b-data'
import type { InvoiceRow } from '@/lib/types'

// Create (no `invoice`) or edit (draft `invoice`) form. A case decides who is billed; otherwise pick a client.
export default async function LbInvoiceForm({
  invoice, clients, cases, prefill, defaultCurrency, defaultDue,
}: {
  invoice?: InvoiceRow
  clients: PersonOpt[]
  cases: CaseOpt[]
  prefill?: { description?: string; amount_cents?: number | null; currency?: string | null }
  defaultCurrency: string
  defaultDue: string
}) {
  const { t } = await getI18n()
  const clientName = (id: string) => { const c = clients.find((x) => x.id === id); return c?.full_name || c?.email || '' }
  const editing = Boolean(invoice)
  return (
    <ActionForm action={editing ? updateInvoice : createInvoice} submitLabel={editing ? t('common.saveChanges') : t('lb.bill.createDraft')} resetOnSuccess={false}
      footer={<Link href={editing ? `/lawyer/billing/${invoice!.id}` : '/lawyer/billing'} className="text-sm font-medium text-slate-600 hover:underline">{t('common.cancel')}</Link>}>
      {invoice && <input type="hidden" name="id" value={invoice.id} />}
      {!editing && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={t('common.case')} name="case_id" emptyLabel={t('lb.bill.noCase')} hint={t('lb.bill.caseHint')}
            options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title} — ${clientName(c.client_id)}` }))} />
          <Select label={t('common.client')} name="client_id" emptyLabel={t('lb.bill.chooseClient')} hint={t('lb.bill.clientHint')}
            options={clients.map((c) => ({ value: c.id, label: c.full_name || c.email }))} />
        </div>
      )}
      <TextArea label={t('common.description')} name="description" rows={5} maxLength={2000} required
        defaultValue={invoice?.description ?? prefill?.description ?? ''} placeholder={t('lb.bill.descPlaceholder')} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t('common.amount')} name="amount" required dir="ltr" placeholder="25000"
          defaultValue={invoice ? centsToInput(invoice.amount_cents) : prefill?.amount_cents ? centsToInput(prefill.amount_cents) : ''} />
        <Select label={t('lb.bill.currency')} name="currency" defaultValue={invoice?.currency ?? prefill?.currency ?? defaultCurrency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        <Field label={t('lb.bill.issued')} name="issued_on" type="date" dir="ltr" defaultValue={invoice?.issued_on} />
        <Field label={t('lb.bill.due')} name="due_on" type="date" dir="ltr" defaultValue={invoice?.due_on ?? defaultDue} />
      </div>
    </ActionForm>
  )
}
