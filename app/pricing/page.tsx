import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import SitePricing from '@/components/SitePricing'
import { getI18n } from '@/lib/i18n'
import { BRAND } from '@/lib/brand'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t('site.meta.pricing'),
    description: t('site.meta.pricingDesc'),
    alternates: { canonical: '/pricing' },
    openGraph: { title: `${t('site.meta.pricing')} · ${BRAND.name}`, description: t('site.meta.pricingDesc'), type: 'website' },
  }
}

export default async function PricingPage() {
  const { t } = await getI18n()
  const faqs = [1, 2, 3, 4, 5] as const
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader />
      <main id="main">
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{t('site.price.eyebrow')}</p>
          <h1 className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-5xl">{t('site.price.title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">{t('site.price.sub')}</p>
          <div className="mt-14"><SitePricing /></div>

          <section aria-labelledby="billing-faq" className="mx-auto mt-20 max-w-3xl">
            <h2 id="billing-faq" className="font-display text-2xl font-semibold text-brand-900">{t('site.price.faq.title')}</h2>
            <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-surface">
              {faqs.map((n) => (
                <details key={n} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
                    {t(`site.price.faq.${n}.q` as const)}
                    <span aria-hidden className="text-gold-600 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{t(`site.price.faq.${n}.a` as const)}</p>
                </details>
              ))}
            </div>
          </section>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
