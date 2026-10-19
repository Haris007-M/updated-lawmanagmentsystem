import Link from 'next/link'
import { BRAND, LEGAL } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import Logo from './Logo'

export default async function SiteFooter() {
  const { t } = await getI18n()
  const col = 'space-y-2.5 text-sm text-slate-400'
  const lnk = 'transition hover:text-white'
  return (
    <footer className="force-light bg-navy-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={36} tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">{t('site.foot.tagline')}</p>
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
            <li><a href={`mailto:${LEGAL.supportEmail}`} className={lnk} dir="ltr">{LEGAL.supportEmail}</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {BRAND.name} · {LEGAL.company}. {t('site.foot.rights')}
      </div>
    </footer>
  )
}
