import Link from 'next/link'
import { Mail, MessageCircle } from 'lucide-react'
import { BRAND, LEGAL } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import { SITE, getWhatsAppHref } from '@/lib/site-config'
import Logo from './Logo'

export default async function SiteFooter() {
  const { t } = await getI18n()
  const wa = await getWhatsAppHref()
  const col = 'space-y-2.5 text-sm text-slate-400'
  const lnk = 'transition hover:text-white'
  return (
    <footer className="force-light bg-navy-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={36} tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">{t('site.foot.tagline')}</p>
          {(SITE.email || wa) && (
            <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
              {SITE.email && (
                <li>
                  <a href={`mailto:${SITE.email}`} className={`${lnk} inline-flex items-center gap-2`} dir="ltr">
                    <Mail className="h-4 w-4 text-gold-400" aria-hidden /> {SITE.email}
                  </a>
                </li>
              )}
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className={`${lnk} inline-flex items-center gap-2`} dir="ltr">
                    <MessageCircle className="h-4 w-4 text-emerald-400" aria-hidden /> WhatsApp +{SITE.whatsapp}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
        <nav aria-label={t('site.foot.product')}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('site.foot.product')}</p>
          <ul className={`mt-4 ${col}`}>
            <li><Link href="/#features" className={lnk}>{t('site.nav.features')}</Link></li>
            <li><Link href="/pricing" className={lnk}>{t('site.nav.pricing')}</Link></li>
            <li><Link href="/contact" className={lnk}>{t('site.nav.contact')}</Link></li>
            <li><Link href="/login" className={lnk}>{t('site.nav.signIn')}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t('site.foot.legal')}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('site.foot.legal')}</p>
          <ul className={`mt-4 ${col}`}>
            <li><Link href="/terms" className={lnk}>{t('site.foot.terms')}</Link></li>
            <li><Link href="/privacy" className={lnk}>{t('site.foot.privacy')}</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {BRAND.name}{LEGAL.company !== BRAND.name && ` · ${LEGAL.company}`}. {t('site.foot.rights')}
      </div>

      {/* Floating chat button, bottom right on every public page */}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('site.contact.whatsapp')}
          title={t('site.contact.whatsapp')}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white/20 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/60"
        >
          <MessageCircle className="h-7 w-7" aria-hidden />
        </a>
      )}
    </footer>
  )
}
