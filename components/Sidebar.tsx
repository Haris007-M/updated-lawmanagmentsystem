'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Briefcase, CalendarDays, Clock, Ellipsis, FileText, Gavel, LayoutDashboard, ListChecks, LogOut,
  Receipt, ScrollText, Search, Settings, ShieldCheck, ShieldQuestion, UserPlus, Users, UsersRound, Wallet,
  CreditCard, LayoutTemplate,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import type { NavIcon, NavItem } from '@/lib/nav'
import Logo from './Logo'
import LanguageSwitch from './LanguageSwitch'
import { useI18n } from './I18nProvider'

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  lawyers: ShieldCheck,
  clients: Users,
  audit: ScrollText,
  settings: Settings,
  cases: Briefcase,
  calendar: CalendarDays,
  tasks: ListChecks,
  documents: FileText,
  billing: Receipt,
  time: Clock,
  templates: LayoutTemplate,
  conflicts: ShieldQuestion,
  team: UsersRound,
  subscription: CreditCard,
  causelist: Gavel,
  leads: UserPlus,
  wallet: Wallet,
  search: Search,
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

// Desktop (lg+): fixed sidebar. Phones and tablets: app-style top bar + bottom tab bar,
// with a slide-up menu for the rest. Uses logical (start/end) classes so it flips for Urdu.
export default function Sidebar({
  items,
  name,
  email,
  roleLabel,
  searchHref,
}: {
  items: NavItem[]
  name: string
  email: string
  roleLabel: string
  // staff and admins get the global search box
  searchHref?: string
}) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [sheet, setSheet] = useState(false)

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')

  const primary = items.filter((i) => i.primary)
  const extras = items.filter((i) => !i.primary)
  const moreActive = extras.some(isActive)
  const tabCount = primary.length + (extras.length > 0 || searchHref ? 1 : 0)

  // lock page scroll behind the sheet; Escape closes it
  useEffect(() => {
    if (!sheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [sheet])

  return (
    <>
      {/* ================= desktop sidebar ================= */}
      <aside className="fixed inset-y-0 start-0 z-50 hidden w-60 flex-col border-e border-slate-200/70 bg-navy-950 text-slate-600 lg:flex print:hidden">
        <div className="flex h-14 items-center px-4">
          <Logo size={28} tone="light" />
        </div>

        {searchHref && (
          <form action={searchHref} role="search" className="px-3 pb-1 pt-1">
            <label htmlFor="global-search" className="sr-only">{t('shell.searchLabel')}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
              <input
                id="global-search"
                name="q"
                type="search"
                placeholder={t('shell.searchPlaceholder')}
                autoComplete="off"
                className="block h-9 w-full rounded-lg border border-slate-200 bg-surface py-0 pe-3 ps-9 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25"
              />
            </div>
          </form>
        )}

        <p className="px-5 pb-1.5 pt-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">{roleLabel}</p>
        <nav aria-label={t('nav.main')} className="flex-1 overflow-y-auto px-3 pb-3">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon]
            const active = isActive(item)
            const newSection = i > 0 && items[i - 1].section !== item.section
            return (
              <div key={item.href} className={newSection ? 'mt-3 border-t border-slate-200/60 pt-3' : 'mt-px'}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors ${
                    active ? 'bg-white/[0.06] text-slate-900' : 'text-slate-500 hover:bg-white/[0.035] hover:text-slate-800'
                  }`}
                >
                  {active && <span className="absolute inset-y-2 -start-3 w-0.5 rounded-e-full bg-gold-500" />}
                  <Icon className={`h-4 w-4 transition-colors ${active ? 'text-gold-500' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden />
                  {t(item.label)}
                </Link>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-slate-200/70 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600 ring-1 ring-gold-500/30">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-900">{name}</p>
              <p className="truncate text-[11.5px] text-slate-500" dir="ltr">{email}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <LanguageSwitch variant="light" className="h-8 flex-1 justify-center !py-0 text-[12.5px]" />
          </div>
          <form action={logout} className="mt-2">
            <button
              type="submit"
              className="flex h-8 w-full items-center justify-center gap-2 rounded-md text-[12.5px] text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-900"
            >
              <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {t('shell.signOut')}
            </button>
          </form>
        </div>
      </aside>

      {/* ================= mobile top bar ================= */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-[calc(3.5rem_+_env(safe-area-inset-top))] items-center justify-between border-b border-slate-200/70 bg-navy-950/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden print:hidden">
        <Link href={items[0]?.href ?? '/'} aria-label={t('nav.home')}>
          <Logo size={26} />
        </Link>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label={t('shell.accountMenu')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600 ring-1 ring-gold-500/30"
        >
          {initials(name)}
        </button>
      </header>

      {/* ================= mobile bottom tab bar ================= */}
      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-navy-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden print:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
          {primary.map((item) => {
            const Icon = ICONS[item.icon]
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSheet(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                    active ? 'text-brand-900' : 'text-slate-500 active:text-slate-800'
                  }`}
                >
                  {active && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-gold-500" />}
                  <Icon className={`h-[22px] w-[22px] ${active ? 'text-gold-600' : ''}`} aria-hidden />
                  <span className="max-w-full truncate">{t(item.short ?? item.label)}</span>
                </Link>
              </li>
            )
          })}
          {(extras.length > 0 || searchHref) && (
            <li>
              <button
                type="button"
                onClick={() => setSheet(true)}
                aria-haspopup="dialog"
                className={`relative flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                  moreActive ? 'text-brand-900' : 'text-slate-500 active:text-slate-800'
                }`}
              >
                {moreActive && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-gold-500" />}
                <Ellipsis className={`h-[22px] w-[22px] ${moreActive ? 'text-gold-600' : ''}`} aria-hidden />
                <span>{t('nav.more')}</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* ================= slide-up menu (More + account) ================= */}
      {sheet && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden" role="dialog" aria-modal="true" aria-label={t('shell.menu')}>
          <button type="button" aria-label={t('common.close')} className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] animate-[sheet-up_220ms_ease-out] overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-500 text-base font-semibold text-on-gold">
                {initials(name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-brand-900">{name}</p>
                <p className="truncate text-sm text-slate-500">{roleLabel} · <span dir="ltr">{email}</span></p>
              </div>
            </div>

            {searchHref && (
              <form action={searchHref} role="search" className="mt-4">
                <label htmlFor="global-search-m" className="sr-only">{t('shell.searchLabel')}</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    id="global-search-m"
                    name="q"
                    type="search"
                    placeholder={t('shell.searchPlaceholder')}
                    className="block min-h-12 w-full rounded-xl border border-slate-300 bg-surface py-2 pe-3 ps-9 text-base text-slate-900 placeholder:text-slate-400 focus:border-gold-600 focus:outline-none focus:ring-4 focus:ring-gold-500/20"
                  />
                </div>
              </form>
            )}

            {extras.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {extras.map((item) => {
                  const Icon = ICONS[item.icon]
                  const active = isActive(item)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSheet(false)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-sm font-medium transition active:scale-[0.98] ${
                        active ? 'border-gold-300 bg-gold-50 text-brand-900' : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${active ? 'text-gold-600' : 'text-slate-500'}`} aria-hidden />
                      {t(item.label)}
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <LanguageSwitch variant="light" className="flex-1 justify-center" />
            </div>

            <form action={logout} className="mt-3">
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-alert-700 transition active:bg-alert-50"
              >
                <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {t('shell.signOut')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
