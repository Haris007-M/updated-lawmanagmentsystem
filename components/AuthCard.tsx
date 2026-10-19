import Image from 'next/image'
import Link from 'next/link'
import { Lock, ShieldCheck, Users } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import Logo from './Logo'
import LanguageSwitch from './LanguageSwitch'

export default async function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const { t } = await getI18n()
  const points = [
    { icon: Lock, text: t('auth.panel.p1') },
    { icon: Users, text: t('auth.panel.p2') },
    { icon: ShieldCheck, text: t('auth.panel.p3') },
  ]
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel (desktop) */}
      <aside className="force-light relative hidden flex-col justify-between overflow-hidden border-e border-slate-200/70 bg-navy-950 p-12 text-white lg:flex">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="55vw" className="object-cover object-right opacity-60 rtl:-scale-x-100" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-950/80 to-navy-950/40" aria-hidden />
        <div className="grid-pattern absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]" aria-hidden />
        <div className="absolute -start-24 top-1/3 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
        <Link href="/" className="relative">
          <Logo size={42} tone="light" />
        </Link>

        <div className="relative">
          <h2 className="max-w-md text-[34px] font-semibold leading-[1.15] tracking-tight">
            {t('auth.panel.title1')}<span className="text-gold-400">{t('auth.panel.title1b')}</span>
            <br />
            {t('auth.panel.title2')}<span className="text-gold-400">{t('auth.panel.title2b')}</span>
          </h2>
          <ul className="mt-10 max-w-md space-y-5">
            {points.map((p) => (
              <li key={p.text} className="flex gap-3.5 text-sm leading-relaxed text-slate-300">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gold-400">
                  <p.icon className="h-4 w-4" aria-hidden />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} {BRAND.name}. {t('auth.panel.foot')}</p>
      </aside>

      {/* form side */}
      <div className="relative flex flex-col items-center justify-center bg-canvas px-6 py-12">
        <div className="absolute end-4 top-4"><LanguageSwitch variant="light" /></div>
        <Link href="/" className="mb-8 lg:hidden">
          <Logo size={40} />
        </Link>
        <div className="w-full max-w-sm rounded-xl border border-slate-200/80 bg-surface p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          {t('auth.footer')} <Link href="/terms" className="underline hover:text-slate-700">{t('auth.terms')}</Link> ·{' '}
          <Link href="/privacy" className="underline hover:text-slate-700">{t('auth.privacy')}</Link>
        </p>
      </div>
    </main>
  )
}
