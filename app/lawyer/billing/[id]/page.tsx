import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { deleteInvoice, setInvoiceStatus } from '@/app/lawyer/billing-actions'
import { InvoiceStatusBadge } from '@/components/Badge'
import ConfirmButton from '@/components/ConfirmButton'
import InvoiceDocument from '@/components/InvoiceDocument'
import PageHeader from '@/components/PageHeader'
import PrintButton from '@/components/PrintButton'
import WhatsAppButton from '@/components/WhatsAppButton'
import { buttonCls, dangerBtnCls, secondaryBtnCls } from '@/components/ui'
import { requireOwner } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { loadFirmSettings } from '@/lib/lawyer-b-data'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow } from '@/lib/types'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireOwner()
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { t, f } = await getI18n()
  const sb = await createClient()

  const { data } = await sb.from('invoices').select('id, lawyer_id, client_id, case_id, number, description, amount_cents, currency, status, issued_on, due_on, paid_on, created_at').eq('id', id).maybeSingle()
  if (!data) notFound()
  const invoice = data as InvoiceRow

  const [client, caseRes, firm] = await Promise.all([
    sb.from('profiles').select('full_name, email, phone').eq('id', invoice.client_id).maybeSingle(),
    invoice.case_id ? sb.from('cases').select('case_number, title').eq('id', invoice.case_id).maybeSingle() : Promise.resolve({ data: null }),
    loadFirmSettings(sb, me.firm_id),
  ])
  const to = { name: client.data?.full_name ?? client.data?.email ?? '—', email: client.data?.email ?? '', phone: client.data?.phone }
  const caseTitle = caseRes.data ? `${caseRes.data.case_number} · ${caseRes.data.title}` : null

  // free click-to-chat reminder: the lawyer just presses send
  const amount = f.money(invoice.amount_cents, invoice.currency)
  const reminder = invoice.status === 'draft'
    ? t('lb.bill.waInvoice', { name: to.name, number: invoice.number, amount, firm: firm?.firm_name ?? me.firm_name ?? '' })
    : t('lb.bill.waReminder', { name: to.name, number: invoice.number, amount, due: f.date(invoice.due_on), firm: firm?.firm_name ?? me.firm_name ?? '' })

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={invoice.number}
          back={{ href: '/lawyer/billing', label: t('nav.billing') }}
          description={undefined}
          actions={<>
            <InvoiceStatusBadge status={invoice.status} />
            <PrintButton />
          </>}
        />
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {invoice.status === 'draft' && <Link href={`/lawyer/billing/${id}/edit`} className={secondaryBtnCls}><Pencil className="h-4 w-4" aria-hidden />{t('common.edit')}</Link>}
          {invoice.status === 'draft' && (
            <form action={setInvoiceStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="sent" /><button type="submit" className={buttonCls}>{t('lb.bill.markSent')}</button></form>
          )}
          {invoice.status === 'sent' && (
            <form action={setInvoiceStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="paid" /><button type="submit" className={buttonCls}>{t('lb.bill.markPaid')}</button></form>
          )}
          {invoice.status === 'sent' && (
            <form action={setInvoiceStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="void" /><ConfirmButton message={t('lb.bill.confirmVoid')} className={secondaryBtnCls}>{t('lb.bill.void')}</ConfirmButton></form>
          )}
          {invoice.status === 'draft' && (
            <form action={deleteInvoice}><input type="hidden" name="id" value={id} /><ConfirmButton message={t('lb.bill.confirmDelete')} className={dangerBtnCls}>{t('common.delete')}</ConfirmButton></form>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'void' && (
            <WhatsAppButton phone={to.phone} message={reminder} whatsappLabel={t('lb.bill.waBtn')} smsLabel={t('lb.bill.smsBtn')} />
          )}
        </div>
        {invoice.status === 'draft' && <p className="mb-4 text-sm text-slate-600">{t('lb.bill.draftNote')}</p>}
        {invoice.status !== 'draft' && invoice.status !== 'void' && !to.phone && (
          <p className="mb-4 text-xs text-slate-500">{t('lb.bill.noPhone')}</p>
        )}
      </div>
      <InvoiceDocument invoice={invoice} from={{ name: me.full_name ?? me.email, email: firm?.email ?? me.email, extra: firm?.firm_name ?? me.firm_name }} to={to} caseTitle={caseTitle} firm={firm} />
    </>
  )
}
