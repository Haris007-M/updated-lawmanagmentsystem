import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Briefcase, CalendarDays, Check, FileText, Gavel, Languages, Lock, MessageCircle, Receipt, ShieldCheck, Users, UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import SitePricing from '@/components/SitePricing'
import { getI18n } from '@/lib/i18n'
import { redirectSignedIn } from '@/lib/home'
import { BRAND } from '@/lib/brand'
import { goldBtnCls, ghostOnDarkBtnCls } from '@/components/ui'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: { absolute: `${BRAND.name} · ${t('site.meta.home')}` },
    description: t('site.meta.homeDesc'),
    alternates: { canonical: '/' },
    openGraph: { title: `${BRAND.name} · ${t('site.meta.home')}`, description: t('site.meta.homeDesc'), type: 'website', siteName: BRAND.name },
  }
}

const FEATURES: { icon: LucideIcon; n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }[] = [
  { icon: Gavel, n: 1 }, { icon: Briefcase, n: 2 }, { icon: Users, n: 3 }, { icon: FileText, n: 4 }, { icon: Receipt, n: 5 },
  { icon: CalendarDays, n: 6 }, { icon: MessageCircle, n: 7 }, { icon: Languages, n: 8 }, { icon: UsersRound, n: 9 },
]

export default async function Home() {
  await redirectSignedIn()
  const { t } = await getI18n()
  const roles = ['lawyer', 'junior', 'client'] as const
  const steps = [1, 2, 3] as const
  const faqs = [1, 2, 3, 4, 5, 6] as const
  const secPoints = [1, 2, 3, 4] as const

  return (
    <div className="min-h-dvh bg-canvas text-slate-900">
      <SiteHeader />
      <main id="main">
        {/* ---------- hero ---------- */}
        <section className="force-light relative overflow-hidden border-b border-slate-200/70 bg-navy-950 text-white">
          <div className="grid-pattern absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" aria-hidden /><div className="absolute end-0 top-0 h-[28rem] w-[40rem] rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-32 sm:pt-28">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-gold-300 ring-1 ring-white/15 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> {t('site.hero.badge')}
            </p>
            <h1 className="max-w-2xl text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[3.6rem]">
              {t('site.hero.title1')}<span className="text-gold-400">{t('site.hero.title2')}</span>{t('site.hero.title3')}<span className="text-gold-400">{t('site.hero.title4')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:mt-6 sm:text-lg">{t('site.hero.sub')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className={goldBtnCls}>{t('site.hero.cta')}</Link>
              <Link href="/pricing" className={`${ghostOnDarkBtnCls} px-6 py-3 text-base`}>{t('site.hero.cta2')}</Link>
            </div>
            <p className="mt-5 text-sm text-slate-400">{t('site.hero.note')}</p>
          </div>
        </section>

        {/* ---------- features ---------- */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{t('site.feat.eyebrow')}</p>
            <h2 id="features-title" className="mx-auto mt-2 max-w-2xl text-center font-display text-3xl font-semibold tracking-tight text-brand-900">{t('site.feat.title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">{t('site.feat.sub')}</p>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, n }) => (
                <li key={n} className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700"><Icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="mt-5 text-base font-semibold text-brand-900">{t(`site.feat.${n}.t` as const)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`site.feat.${n}.d` as const)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section aria-labelledby="how-title" className="border-y border-slate-200 bg-surface py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{t('site.how.eyebrow')}</p>
            <h2 id="how-title" className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-brand-900">{t('site.how.title')}</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((n) => (
                <li key={n} className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 font-display text-lg font-semibold text-gold-400" aria-hidden>{n}</span>
                  <h3 className="mt-4 text-base font-semibold text-brand-900">{t(`site.how.${n}.t` as const)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`site.how.${n}.d` as const)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- roles ---------- */}
        <section aria-labelledby="roles-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{t('site.roles.eyebrow')}</p>
          <h2 id="roles-title" className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-brand-900">{t('site.roles.title')}</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {roles.map((r) => (
              <article key={r} className="rounded-2xl border border-slate-200 bg-surface p-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">{t(`site.roles.${r}.tag` as const)}</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-brand-900">{t(`site.roles.${r}.name` as const)}</h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  {([1, 2, 3, 4] as const).map((i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700"><Check className="h-3 w-3" aria-hidden /></span>
                      {t(`site.roles.${r}.${i}` as const)}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- security ---------- */}
        <section aria-labelledby="sec-title" className="force-light relative overflow-hidden bg-navy-900 py-20 text-white">
          <div className="grid-pattern absolute inset-0 opacity-70" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-gold-400 ring-1 ring-white/15"><Lock className="h-6 w-6" aria-hidden /></span>
              <h2 id="sec-title" className="mt-5 font-display text-3xl font-semibold tracking-tight">{t('site.sec.title')}</h2>
              <p className="mt-4 leading-relaxed text-slate-300">{t('site.sec.text')}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
                {secPoints.map((n) => (
                  <li key={n} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden /> {t(`site.sec.${n}` as const)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- pricing teaser ---------- */}
        <section aria-labelledby="price-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{t('site.price.eyebrow')}</p>
          <h2 id="price-title" className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-brand-900">{t('site.price.title')}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">{t('site.price.sub')}</p>
          <div className="mt-12"><SitePricing showCompare={false} /></div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 border-t border-slate-200 bg-surface py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{t('site.faq.eyebrow')}</p>
            <h2 id="faq-title" className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-brand-900">{t('site.faq.title')}</h2>
            <div className="mt-10 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {faqs.map((n) => (
                <details key={n} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
                    {t(`site.faq.${n}.q` as const)}
                    <span aria-hidden className="text-gold-600 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{t(`site.faq.${n}.a` as const)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- final CTA ---------- */}
        <section aria-labelledby="cta-title" className="force-light bg-navy-900 py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h2 id="cta-title" className="font-display text-3xl font-semibold tracking-tight">{t('site.cta.title')}</h2>
            <p className="mt-3 text-slate-300">{t('site.cta.text')}</p>
            <Link href="/contact" className={`${goldBtnCls} mt-8`}>{t('site.hero.cta')}</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
