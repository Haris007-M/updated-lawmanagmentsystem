import Link from 'next/link'
import { Menu } from 'lucide-react'
import { getI18n } from '@/lib/i18n'
import Logo from './Logo'
import LanguageSwitch from './LanguageSwitch'
import { buttonCls, secondaryBtnCls } from './ui'

// Sticky public header. The mobile menu is a plain <details> element: works without JavaScript.
export default async function SiteHeader() {
  const { t } = await getI18n()
  const links = [
    { href: '/#features', label: t('site.nav.features') },
    { href: '/pricing', label: t('site.nav.pricing') },
    { href: '/#faq', label: t('site.nav.faq') },
    { href: '/contact', label: t('site.nav.contact') },
  ]
  const linkCls = 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-brand-900'
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={t('nav.home')}><Logo size={34} /></Link>

        <nav aria-label={t('site.nav.main')} className="hidden items-center gap-1 md:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className={linkCls}>{l.label}</Link>)}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitch variant="light" />
          <Link href="/login" className={secondaryBtnCls}>{t('site.nav.signIn')}</Link>
          <Link href="/contact" className={buttonCls}>{t('site.nav.trial')}</Link>
        </div>

        <details className="group relative md:hidden">
          <summary
            aria-label={t('site.nav.menu')}
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-300 bg-surface text-slate-700 [&::-webkit-details-marker]:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </summary>
          <div className="absolute end-0 top-12 w-72 rounded-2xl border border-slate-200 bg-surface p-3 shadow-xl">
            <nav aria-label={t('site.nav.main')} className="flex flex-col">
              {links.map((l) => <Link key={l.href} href={l.href} className={`${linkCls} py-3`}>{l.label}</Link>)}
            </nav>
            <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
              <LanguageSwitch variant="light" className="flex-1 justify-center" />
            </div>
            <div className="mt-3 grid gap-2">
              <Link href="/login" className={secondaryBtnCls}>{t('site.nav.signIn')}</Link>
              <Link href="/contact" className={buttonCls}>{t('site.nav.trial')}</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}
