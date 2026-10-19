import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import PrintButton from '@/components/PrintButton'
import { requireRole } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import type { FirmSettings, InvoiceRow } from '@/lib/types'
import ClientInvoiceView from '../../_components/ClientInvoiceView'

export default async function ClientInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('client')
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { t } = await getI18n()

  const supabase = await createClient()
  // RLS already hides drafts and other people's invoices; the filter is belt and braces.
  const { data } = await supabase.from('invoices').select('*').eq('id', id).eq('client_id', me.id).maybeSingle()
  if (!data) notFound()
  const invoice = data as InvoiceRow

  const [firmRes, caseRes] = await Promise.all([
    supabase.from('firm_settings').select('firm_name, address, phone, email, ntn, bank_details, invoice_terms').eq('firm_id', invoice.lawyer_id).maybeSingle(),
    invoice.case_id ? supabase.from('cases').select('title').eq('id', invoice.case_id).maybeSingle() : Promise.resolve({ data: null }),
  ])

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={invoice.number} back={{ href: '/client/invoices', label: t('cl.inv.all') }} actions={<PrintButton />} />
      </div>
      <ClientInvoiceView
        invoice={invoice}
        firm={firmRes.data as Partial<FirmSettings> | null}
        toName={me.full_name ?? me.email}
        toEmail={me.email}
        caseTitle={(caseRes.data as { title: string } | null)?.title}
      />
    </>
  )
}
