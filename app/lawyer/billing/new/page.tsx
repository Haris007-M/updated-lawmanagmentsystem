import { requireOwner } from '@/lib/auth'
import Card from '@/components/Card'
import LbInvoiceForm from '@/components/LbInvoiceForm'
import { Select } from '@/components/Field'
import PageHeader from '@/components/PageHeader'
import { secondaryBtnCls } from '@/components/ui'
import { getI18n } from '@/lib/i18n'
import { loadCaseOptions, loadClientOptions, loadFirmPrefs } from '@/lib/lawyer-b-data'
import { STARTERS } from '@/lib/lawyer-b-templates'
import { first, type SearchParams } from '@/lib/paging'
import { isUuid } from '@/lib/form'
import { addDaysISO, todayISO } from '@/lib/tz'
import { createClient } from '@/lib/supabase/server'
import type { TemplateRow } from '@/lib/types'

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireOwner()
  const sp = await searchParams
  const { t } = await getI18n()
  const sb = await createClient()
  const [prefs, clients, cases, tpl] = await Promise.all([
    loadFirmPrefs(sb, me.firm_id),
    loadClientOptions(sb),
    loadCaseOptions(sb, true),
    sb.from('templates').select('id, name, body, amount_cents, currency').eq('kind', 'invoice').order('name').limit(100),
  ])
  const templates = (tpl.data ?? []) as Pick<TemplateRow, 'id' | 'name' | 'body' | 'amount_cents' | 'currency'>[]

  const pick = first(sp.template)
  const chosen = isUuid(pick)
    ? templates.find((x) => x.id === pick)
    : STARTERS.find((s) => s.kind === 'invoice' && s.id === pick)
  const prefill = chosen
    ? { description: chosen.body, amount_cents: 'amount_cents' in chosen ? chosen.amount_cents ?? null : null, currency: 'currency' in chosen ? chosen.currency ?? null : null }
    : undefined

  const options = [
    ...templates.map((x) => ({ value: x.id, label: x.name })),
    ...STARTERS.filter((s) => s.kind === 'invoice').map((s) => ({ value: s.id, label: `${s.name} (${t('lb.tpl.starter')})` })),
  ]

  return (
    <>
      <PageHeader title={t('lb.bill.new')} back={{ href: '/lawyer/billing', label: t('nav.billing') }} description={t('lb.bill.newHint')} />
      <form method="get" action="/lawyer/billing/new" className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1 sm:max-w-sm"><Select label={t('lb.bill.useTemplate')} name="template" defaultValue={pick} emptyLabel={t('lb.bill.noTemplate')} options={options} /></div>
        <button type="submit" className={secondaryBtnCls}>{t('lb.bill.apply')}</button>
      </form>
      <Card>
        <LbInvoiceForm clients={clients} cases={cases} prefill={prefill} defaultCurrency={prefs.default_currency}
          defaultDue={addDaysISO(todayISO(), prefs.default_due_days)} />
      </Card>
    </>
  )
}
