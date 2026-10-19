import type { Metadata } from 'next'
import { Mail, MessageCircle } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import LeadForm from '@/components/LeadForm'
import { getI18n } from '@/lib/i18n'
import { BRAND } from '@/lib/brand'
import { first, type SearchParams } from '@/lib/paging'
import { PLANS } from '@/lib/plans'
import { SITE } from '@/lib/site-config'
import { whatsappLink } from '@/lib/whatsapp'
import { secondaryBtnCls } from '@/components/ui'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t('site.meta.contact'),
    description: t('site.meta.contactDesc'),
    alternates: { canonical: '/contact' },
    openGraph: { title: `${t('site.meta.contact')} · ${BRAND.name}`, description: t('site.meta.contactDesc'), type: 'website' },
  }
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const { t } = await getI18n()
  const planParam = first(sp.plan)
  const plan = planParam in PLANS ? planParam : ''
  const wa = SITE.whatsapp ? whatsappLink(SITE.whatsapp, t('site.contact.waText', { brand: BRAND.name })) : null

  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader />
      <main id="main" className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="contact-title">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{t('site.contact.eyebrow')}</p>
          <h1 id="contact-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">{t('site.contact.title')}</h1>
          <p className="mt-3 max-w-xl text-slate-600">{t('site.contact.sub')}</p>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm sm:p-8">
            <LeadForm defaultPlan={plan} />
          </div>
        </section>

        <aside aria-labelledby="direct" className="h-fit rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
          <h2 id="direct" className="font-display text-lg font-semibold text-brand-900">{t('site.contact.direct')}</h2>
          <div className="mt-4 grid gap-3">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={secondaryBtnCls}>
                <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden /> {t('site.contact.whatsapp')}
              </a>
            )}
            <a href={`mailto:${SITE.email}`} className={secondaryBtnCls}>
              <Mail className="h-4 w-4" aria-hidden /> {t('site.contact.emailUs')}
            </a>
            <p className="text-center text-xs text-slate-500" dir="ltr">{SITE.email}</p>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  )
}
