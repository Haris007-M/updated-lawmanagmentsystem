import { getI18n } from '@/lib/i18n'
import { BRAND } from '@/lib/brand'
import type { FirmSettings, InvoiceRow } from '@/lib/types'
import { InvoiceStatusBadge } from '@/components/Badge'

// Print-friendly invoice with the firm's letterhead. Always white paper with dark text (also in dark mode).
export default async function ClientInvoiceView({
  invoice, firm, toName, toEmail, caseTitle,
}: { invoice: InvoiceRow; firm: Partial<FirmSettings> | null; toName: string; toEmail: string; caseTitle?: string | null }) {
  const { t, f } = await getI18n()
  const money = (c: number) => f.money(c, invoice.currency)
  return (
    <article className="print-sheet mx-auto max-w-3xl rounded-xl border border-slate-200 bg-surface p-5 shadow-sm sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">{t('cl.inv.invoice')}</h2>
          <p className="mt-1 text-sm text-slate-500" dir="ltr">{invoice.number}</p>
        </div>
        <div className="text-sm sm:text-end">
          <p className="font-semibold text-slate-900">{firm?.firm_name}</p>
          {firm?.address && <p className="whitespace-pre-line text-xs text-slate-500">{firm.address}</p>}
          {firm?.phone && <p className="text-xs text-slate-500" dir="ltr">{firm.phone}</p>}
          {firm?.email && <p className="text-xs text-slate-500" dir="ltr">{firm.email}</p>}
          {firm?.ntn && <p className="text-xs text-slate-500">{t('cl.inv.ntn', { n: firm.ntn })}</p>}
        </div>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-slate-500">{t('cl.inv.billedTo')}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{toName}</p>
          <p className="text-sm text-slate-600" dir="ltr">{toEmail}</p>
        </div>
        <dl className="space-y-1 text-sm sm:text-end">
          <div><dt className="inline text-slate-500">{t('cl.inv.issued')}: </dt><dd className="inline text-slate-900">{f.date(invoice.issued_on)}</dd></div>
          <div><dt className="inline text-slate-500">{t('cl.inv.due')}: </dt><dd className="inline text-slate-900">{f.date(invoice.due_on)}</dd></div>
          <div><dt className="inline text-slate-500">{t('cl.inv.status')}: </dt><dd className="inline"><InvoiceStatusBadge status={invoice.status} /></dd></div>
        </dl>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            <th className="py-2 text-start font-medium">{t('cl.inv.description')}</th>
            <th className="py-2 text-end font-medium">{t('cl.col.amount')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-3 text-slate-800">
              <p className="whitespace-pre-wrap">{invoice.description || t('cl.inv.defaultDesc')}</p>
              {caseTitle && <p className="mt-1 text-xs text-slate-500">{t('cl.inv.matter', { title: caseTitle })}</p>}
            </td>
            <td className="py-3 text-end text-slate-900" dir="ltr">{money(invoice.amount_cents)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-4 text-end text-sm font-semibold text-slate-900">{t('cl.inv.totalDue')}</td>
            <td className="pt-4 text-end text-lg font-semibold text-slate-900" dir="ltr">
              {money(invoice.status === 'paid' || invoice.status === 'void' ? 0 : invoice.amount_cents)}
            </td>
          </tr>
        </tfoot>
      </table>

      {invoice.status === 'paid' && (
        <p className="mt-4 text-end text-sm font-medium text-green-700 dark:text-green-300">{t('cl.inv.paidOn', { date: f.date(invoice.paid_on) })}</p>
      )}

      {invoice.status === 'sent' && firm?.bank_details && (
        <section className="mt-8 rounded-lg bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{t('cl.inv.howToPay')}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{firm.bank_details}</p>
        </section>
      )}
      {firm?.invoice_terms && (
        <section className="mt-4">
          <h3 className="text-xs font-semibold text-slate-500">{t('cl.inv.terms')}</h3>
          <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{firm.invoice_terms}</p>
        </section>
      )}
      <p className="mt-10 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">{t('cl.inv.generated', { brand: BRAND.name })}</p>
    </article>
  )
}
