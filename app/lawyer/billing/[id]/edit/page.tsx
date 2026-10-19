import { notFound, redirect } from 'next/navigation'
import Card from '@/components/Card'
import LbInvoiceForm from '@/components/LbInvoiceForm'
import PageHeader from '@/components/PageHeader'
import { requireOwner } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { loadFirmPrefs } from '@/lib/lawyer-b-data'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow } from '@/lib/types'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireOwner()
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { t } = await getI18n()
  const sb = await createClient()
  const { data } = await sb.from('invoices').select('id, lawyer_id, client_id, case_id, number, description, amount_cents, currency, status, issued_on, due_on, paid_on, created_at').eq('id', id).maybeSingle()
  if (!data) notFound()
  if (data.status !== 'draft') redirect(`/lawyer/billing/${id}`)
  const prefs = await loadFirmPrefs(sb, me.firm_id)

  return (
    <>
      <PageHeader title={`${t('common.edit')} ${data.number}`} back={{ href: `/lawyer/billing/${id}`, label: data.number }} description={t('lb.bill.editHint')} />
      <Card>
        <LbInvoiceForm invoice={data as InvoiceRow} clients={[]} cases={[]} defaultCurrency={prefs.default_currency} defaultDue="" />
      </Card>
    </>
  )
}
