import { getI18n } from '@/lib/i18n'
import { PAPER_STYLE } from '@/lib/lawyer-b-paper'
import type { FirmSettings, InvoiceRow } from '@/lib/types'

type Party = { name: string; email: string; extra?: string | null; phone?: string | null }

// Print-friendly invoice (Print button, then "Save as PDF"). Always white paper, also in dark mode.
// `firm` adds the letterhead (address, tax number), payment instructions and terms.
export default async function InvoiceDocument({
  invoice, from, to, caseTitle, firm,
}: { invoice: InvoiceRow; from: Party; to: Party; caseTitle?: string | null; firm?: FirmSettings | null }) {
  const { t, f } = await getI18n()
  const firmName = firm?.firm_name || from.extra || from.name
  const contact = [firm?.address, firm?.phone, firm?.email || from.email].filter(Boolean)

  return (
    <article style={PAPER_STYLE} className="print-sheet mx-auto max-w-3xl rounded-xl border border-slate-200 p-5 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-gold-600 pb-6">
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold text-slate-900">{firmName}</p>
          {contact.map((line, i) => <p key={i} className="mt-0.5 whitespace-pre-line text-xs text-slate-500">{line}</p>)}
          {firm?.ntn && <p className="mt-0.5 text-xs text-slate-500">{t('lb.bill.ntn')}: <span dir="ltr">{firm.ntn}</span></p>}
        </div>
        <div className="text-end">
          <h2 className="font-display text-3xl font-semibold tracking-wide text-gold-700">{t('lb.bill.invoice')}</h2>
          <p className="mt-1 text-sm font-medium text-slate-700" dir="ltr">{invoice.number}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-slate-500">{t('lb.bill.billedTo')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{to.name}</p>
          <p className="text-sm text-slate-600" dir="ltr">{to.email}</p>
          {to.phone && <p className="text-sm text-slate-600" dir="ltr">{to.phone}</p>}
        </div>
        <dl className="space-y-1 text-sm sm:text-end">
          <div><dt className="inline text-slate-500">{t('lb.bill.issued')}: </dt><dd className="inline text-slate-900">{f.date(invoice.issued_on)}</dd></div>
          <div><dt className="inline text-slate-500">{t('lb.bill.due')}: </dt><dd className="inline text-slate-900">{f.date(invoice.due_on)}</dd></div>
          <div><dt className="inline text-slate-500">{t('common.status')}: </dt><dd className="inline font-semibold text-slate-900">{t(`invoiceStatus.${invoice.status}`)}</dd></div>
        </dl>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-start text-xs text-slate-500">
            <th scope="col" className="py-2 text-start font-medium">{t('common.description')}</th>
            <th scope="col" className="py-2 text-end font-medium">{t('common.amount')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100 align-top">
            <td className="py-3 pe-4 text-slate-800">
              <p className="whitespace-pre-wrap break-words">{invoice.description || t('lb.bill.defaultDesc')}</p>
              {caseTitle && <p className="mt-2 text-xs text-slate-500">{t('lb.bill.matter')}: {caseTitle}</p>}
            </td>
            <td className="whitespace-nowrap py-3 text-end text-slate-900">{f.money(invoice.amount_cents, invoice.currency)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-4 text-end text-sm font-semibold text-slate-900">{invoice.status === 'paid' ? t('lb.bill.totalPaid') : t('lb.bill.totalDue')}</td>
            <td className="whitespace-nowrap pt-4 text-end text-xl font-semibold text-slate-900">{f.money(invoice.amount_cents, invoice.currency)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.status === 'paid' && (
        <p className="mt-4 text-end text-sm font-semibold text-green-700">{t('lb.bill.paidOn', { date: f.date(invoice.paid_on) })}</p>
      )}
      {invoice.status === 'void' && <p className="mt-4 text-end text-sm font-semibold text-alert-700">{t('lb.bill.voidNote')}</p>}

      {(firm?.bank_details || firm?.invoice_terms) && invoice.status !== 'paid' && (
        <section className="mt-10 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
          {firm?.bank_details && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500">{t('lb.bill.payTo')}</h3>
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-800" dir="ltr">{firm.bank_details}</p>
            </div>
          )}
          {firm?.invoice_terms && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500">{t('lb.bill.terms')}</h3>
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-700">{firm.invoice_terms}</p>
            </div>
          )}
        </section>
      )}
    </article>
  )
}
