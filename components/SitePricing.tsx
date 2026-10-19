import Link from 'next/link'
import { Check } from 'lucide-react'
import { getI18n } from '@/lib/i18n'
import { DISCOUNT_BY_MONTHS, MONTH_OPTIONS, PLANS, PLAN_CURRENCY, PLAN_ORDER, planPrice } from '@/lib/plans'
import { buttonCls, secondaryBtnCls } from './ui'

const pkr = (whole: number) => whole * 100

// Plan cards + "pay for longer" table + accessible comparison table. Server-rendered, no client JS.
export default async function SitePricing({ showCompare = true }: { showCompare?: boolean }) {
  const { t, f } = await getI18n()
  const money = (n: number) => f.money(pkr(n), PLAN_CURRENCY)

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id]
          return (
            <article
              key={id}
              aria-labelledby={`plan-${id}`}
              className={`relative flex flex-col rounded-2xl border bg-surface p-7 shadow-sm ${p.highlight ? 'border-gold-500 ring-2 ring-gold-500/40' : 'border-slate-200'}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 start-7 rounded-full bg-gold-500 px-3 py-0.5 text-xs font-semibold text-on-gold">{t('site.price.popular')}</span>
              )}
              <h3 id={`plan-${id}`} className="font-display text-xl font-semibold text-brand-900">{p.name}</h3>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold tracking-tight text-brand-900">{money(p.priceMonthly)}</span>
                <span className="text-sm text-slate-500">{t('site.price.perMonth')}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
                {[t('site.price.juniors', { n: p.maxJuniors }), t('site.price.clients', { n: p.maxClients }), t('site.price.storage', { n: p.storageGb }), t('site.price.allFeatures')].map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
              <Link href={`/contact?plan=${id}`} className={`${p.highlight ? buttonCls : secondaryBtnCls} mt-8 w-full`}>
                {t('site.price.choose', { plan: p.name })}
              </Link>
            </article>
          )
        })}
      </div>
      <p className="mt-5 text-center text-sm text-slate-500">{t('site.price.trialNote')}</p>

      <section aria-labelledby="durations" className="mt-14">
        <h3 id="durations" className="font-display text-2xl font-semibold text-brand-900">{t('site.price.durations')}</h3>
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-surface">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">{t('site.price.durations')}</caption>
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-medium">{t('site.price.feature')}</th>
                {MONTH_OPTIONS.map((m) => {
                  const pct = Math.round((1 - (DISCOUNT_BY_MONTHS[m] ?? 1)) * 100)
                  return (
                    <th key={m} scope="col" className="px-4 py-3 text-start font-medium">
                      {t('site.price.months', { n: m })}
                      {pct > 0 && <span className="ms-2 rounded-full bg-gold-100 px-1.5 py-0.5 text-[11px] font-semibold text-gold-800">{t('site.price.save', { pct })}</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PLAN_ORDER.map((id) => (
                <tr key={id}>
                  <th scope="row" className="px-4 py-3 text-start font-semibold text-brand-900">{PLANS[id].name}</th>
                  {MONTH_OPTIONS.map((m) => <td key={m} className="px-4 py-3 text-slate-700">{money(planPrice(id, m))}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showCompare && (
        <section aria-labelledby="compare" className="mt-14">
          <h3 id="compare" className="font-display text-2xl font-semibold text-brand-900">{t('site.price.compare')}</h3>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-surface">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">{t('site.price.compare')}</caption>
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('site.price.feature')}</th>
                  {PLAN_ORDER.map((id) => <th key={id} scope="col" className="px-4 py-3 text-start font-semibold text-brand-900">{PLANS[id].name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <th scope="row" className="px-4 py-3 text-start font-medium">{t('site.price.perMonth')}</th>
                  {PLAN_ORDER.map((id) => <td key={id} className="px-4 py-3">{money(PLANS[id].priceMonthly)}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 text-start font-medium">{t('site.price.owner')}</th>
                  {PLAN_ORDER.map((id) => <td key={id} className="px-4 py-3">{t('site.price.included')}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 text-start font-medium">{t('role.junior')}</th>
                  {PLAN_ORDER.map((id) => <td key={id} className="px-4 py-3">{f.number(PLANS[id].maxJuniors)}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 text-start font-medium">{t('nav.clients')}</th>
                  {PLAN_ORDER.map((id) => <td key={id} className="px-4 py-3">{f.number(PLANS[id].maxClients)}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 text-start font-medium">{t('nav.documents')}</th>
                  {PLAN_ORDER.map((id) => <td key={id} className="px-4 py-3">{PLANS[id].storageGb} GB</td>)}
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 text-start font-medium">{t('site.price.allFeatures')}</th>
                  {PLAN_ORDER.map((id) => <td key={id} className="px-4 py-3"><Check className="h-4 w-4 text-gold-600" aria-label={t('site.price.included')} /></td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
