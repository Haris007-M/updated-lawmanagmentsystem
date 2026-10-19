import Link from 'next/link'
import { getI18n } from '@/lib/i18n'
import type { InvoiceRow } from '@/lib/types'
import { InvoiceStatusBadge } from '@/components/Badge'
import EmptyState from '@/components/EmptyState'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { linkCls } from '@/components/ui'

export default async function ClientInvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  const { t, f } = await getI18n()
  if (invoices.length === 0) return <EmptyState kind="invoices" title={t('cl.inv.none')} hint={t('cl.inv.noneHint')} />
  return (
    <Table>
      <THead>
        <Th>{t('cl.col.number')}</Th><Th>{t('cl.col.issued')}</Th><Th>{t('cl.col.due')}</Th>
        <Th>{t('cl.col.amount')}</Th><Th>{t('cl.col.status')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th>
      </THead>
      <TBody>
        {invoices.map((i) => (
          <Tr key={i.id}>
            <Td label={t('cl.col.number')}><Link href={`/client/invoices/${i.id}`} className={linkCls}>{i.number}</Link></Td>
            <Td label={t('cl.col.issued')}>{f.date(i.issued_on)}</Td>
            <Td label={t('cl.col.due')}>{f.date(i.due_on)}</Td>
            <Td label={t('cl.col.amount')}><span dir="ltr" className="font-medium text-slate-900">{f.money(i.amount_cents, i.currency)}</span></Td>
            <Td label={t('cl.col.status')}><InvoiceStatusBadge status={i.status} /></Td>
            <Td label=""><Link href={`/client/invoices/${i.id}`} className={linkCls}>{t('cl.inv.view')}</Link></Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  )
}
