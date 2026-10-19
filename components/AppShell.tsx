import Link from 'next/link'
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react'
import Sidebar from './Sidebar'
import { getI18n } from '@/lib/i18n'
import { ROLE_HOME, type Context } from '@/lib/types'
import type { NavItem } from '@/lib/nav'

function daysLeft(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function Banner({ tone, icon, text, href, cta }: { tone: 'gold' | 'alert'; icon: React.ReactNode; text: string; href: string; cta: string }) {
  const cls =
    tone === 'alert'
      ? 'border-alert-200 bg-alert-50 text-alert-700'
      : 'border-gold-200 bg-gold-50 text-gold-700'
  return (
    <div role="status" className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-[13px] print:hidden ${cls}`}>
      <span className="flex items-center gap-2">{icon}{text}</span>
      <Link href={href} className="font-semibold underline underline-offset-2">{cta}</Link>
    </div>
  )
}

export default async function AppShell({
  me,
  nav,
  children,
}: {
  me: Context
  nav: NavItem[]
  children: React.ReactNode
}) {
  const { t } = await getI18n()
  const isOwner = me.role === 'lawyer'
  const staff = me.role === 'lawyer' || me.role === 'junior'
  const subHref = '/lawyer/subscription'

  return (
    <div className="app-canvas min-h-dvh">
      <a href="#main" className="sr-only z-[60] rounded-lg bg-gold-500 px-4 py-2 font-semibold text-on-gold focus:not-sr-only focus:fixed focus:start-3 focus:top-3">
        {t('shell.skip')}
      </a>
      <Sidebar
        items={nav}
        name={me.full_name ?? me.email}
        email={me.email}
        roleLabel={t(`role.${me.role}` as const)}
        searchHref={staff && me.billing !== 'locked' ? '/lawyer/search' : me.role === 'super_admin' ? '/admin/search' : undefined}
      />
      <main id="main" tabIndex={-1} className="pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] pt-[calc(3.5rem_+_env(safe-area-inset-top))] outline-none lg:pb-0 lg:ps-60 lg:pt-0 print:pb-0 print:ps-0 print:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {isOwner && me.billing === 'ok' && me.billing_status === 'trial' && (
            <Banner
              tone="gold"
              icon={<Clock className="h-4 w-4 shrink-0" aria-hidden />}
              text={t('shell.trialBanner', { days: daysLeft(me.billing_ends_at) })}
              href={subHref}
              cta={t('shell.choosePlan')}
            />
          )}
          {isOwner && me.billing === 'grace' && (
            <Banner
              tone="alert"
              icon={<AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />}
              text={t('shell.dueBanner')}
              href={subHref}
              cta={t('shell.renew')}
            />
          )}
          {me.role !== 'client' && !me.mfa_enabled && (
            <Banner
              tone="gold"
              icon={<ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />}
              text={t('shell.mfaBanner')}
              href={`${ROLE_HOME[me.role]}/settings`}
              cta={t('shell.setUp')}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
