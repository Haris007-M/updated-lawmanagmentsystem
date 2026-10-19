import Link from 'next/link'
import { deleteInvoice, setInvoiceStatus } from '@/app/lawyer/billing-actions'
import { getI18n } from '@/lib/i18n'
import { nameOf, type NameMap } from '@/lib/data'
import type { InvoiceRow } from '@/lib/types'
import { InvoiceStatusBadge } from './Badge'
import ConfirmButton from './ConfirmButton'
import EmptyState from './EmptyState'
import { Table, TBody, Td, Th, THead, Tr } from './Table'
import { dangerLinkCls, linkCls } from './ui'

function StatusForm({ id, status, label, danger, confirm }: { id: string; status: string; label: string; danger?: boolean; confirm?: string }) {
  return (
    <form action={setInvoiceStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      {danger ? (
        <ConfirmButton message={confirm ?? ''} className={dangerLinkCls}>{label}</ConfirmButton>
      ) : (
        <button type="submit" className={linkCls}>{label}</button>
      )}
    </form>
  )
}

// Invoice list. role 'lawyer' (or 'staff') = the firm owner's view with quick actions; 'client' = read only.
export default async function InvoiceTable({
  invoices, names, caseTitles = {}, role, basePath, emptyHint,
}: {
  invoices: InvoiceRow[]
  names: NameMap
  caseTitles?: Record<string, string>
  role: 'lawyer' | 'staff' | 'client'
  basePath: string
  emptyHint?: string
}) {
  const { t, f } = await getI18n()
  const owner = role !== 'client'
  if (invoices.length === 0) {
    return <EmptyState kind="invoices" title={t('lb.bill.none')} hint={emptyHint ?? (owner ? t('lb.bill.noneHint') : t('lb.bill.noneClient'))} />
  }
  return (
    <Table>
      <THead>
        <Th>{t('lb.bill.invoice')}</Th>
        <Th>{owner ? t('common.client') : t('lb.bill.from')}</Th>
        <Th>{t('common.amount')}</Th>
        <Th>{t('common.status')}</Th>
        <Th>{t('lb.bill.due')}</Th>
        {owner && <Th><span className="sr-only">{t('common.actions')}</span></Th>}
      </THead>
      <TBody>
        {invoices.map((i) => (
          <Tr key={i.id}>
            <Td label={t('lb.bill.invoice')}>
              <Link href={`${basePath}/${i.id}`} className={linkCls} dir="ltr">{i.number}</Link>
              <p className="text-xs text-slate-500">{i.case_id && caseTitles[i.case_id] ? caseTitles[i.case_id] : f.date(i.issued_on)}</p>
            </Td>
            <Td label={owner ? t('common.client') : t('lb.bill.from')}>{nameOf(names, owner ? i.client_id : i.lawyer_id, t('common.unknown'))}</Td>
            <Td label={t('common.amount')} className="font-medium text-slate-900">{f.money(i.amount_cents, i.currency)}</Td>
            <Td label={t('common.status')}><InvoiceStatusBadge status={i.status} /></Td>
            <Td label={t('lb.bill.due')}>{i.status === 'paid' ? t('lb.bill.paidShort', { date: f.date(i.paid_on) }) : f.date(i.due_on)}</Td>
            {owner && (
              <Td label="">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {i.status === 'draft' && <Link href={`${basePath}/${i.id}/edit`} className={linkCls}>{t('common.edit')}</Link>}
                  {i.status === 'draft' && <StatusForm id={i.id} status="sent" label={t('lb.bill.markSent')} />}
                  {i.status === 'sent' && <StatusForm id={i.id} status="paid" label={t('lb.bill.markPaid')} />}
                  {i.status === 'draft' && (
                    <form action={deleteInvoice}>
                      <input type="hidden" name="id" value={i.id} />
                      <ConfirmButton message={t('lb.bill.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
                    </form>
                  )}
                  {i.status === 'sent' && <StatusForm id={i.id} status="void" label={t('lb.bill.void')} danger confirm={t('lb.bill.confirmVoid')} />}
                </div>
              </Td>
            )}
          </Tr>
        ))}
      </TBody>
    </Table>
  )
}
