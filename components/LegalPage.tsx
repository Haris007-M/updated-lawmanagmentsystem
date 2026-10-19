import { AlertTriangle } from 'lucide-react'
import { BRAND, LEGAL } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import { getLegalDoc } from '@/lib/site-legal'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

// Terms / Privacy. Renders in the visitor's language (RTL for Urdu). The "template" notice is ALWAYS shown.
export default async function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  const { t, locale } = await getI18n()
  const doc = getLegalDoc(kind, locale, {
    brand: BRAND.name, company: LEGAL.company, email: LEGAL.supportEmail, jurisdiction: LEGAL.jurisdiction,
  })
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div role="note" className="mb-8 flex gap-3 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3.5 text-sm text-gold-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('site.legal.notice')}</p>
            <p className="mt-1 leading-relaxed">{t('site.legal.noticeText')}</p>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('site.legal.updated', { date: LEGAL.updated })}</p>
        {doc.intro.map((p) => <p key={p} className="mt-6 text-[15px] leading-7 text-slate-700">{p}</p>)}

        <nav aria-label={t('site.legal.toc')} className="mt-8 rounded-xl border border-slate-200 bg-surface p-4">
          <p className="text-xs font-semibold text-slate-500">{t('site.legal.toc')}</p>
          <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {doc.sections.map((s) => (
              <li key={s.id}><a href={`#${s.id}`} className="text-brand-700 underline-offset-2 hover:underline">{s.h}</a></li>
            ))}
          </ol>
        </nav>

        <article className="mt-8 space-y-9">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="font-display text-xl font-semibold text-brand-900 sm:text-2xl">{s.h}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">
                {s.p?.map((p) => <p key={p}>{p}</p>)}
                {s.ul && (
                  <ul className="list-disc space-y-1.5 ps-6 marker:text-gold-600">
                    {s.ul.map((li) => <li key={li}>{li}</li>)}
                  </ul>
                )}
                {s.after?.map((p) => <p key={p}>{p}</p>)}
              </div>
            </section>
          ))}
        </article>

        <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
          {t('site.legal.contactUs', { email: LEGAL.supportEmail })}
          <br />
          {t('site.legal.otherLang')}
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
