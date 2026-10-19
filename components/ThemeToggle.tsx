'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useI18n } from './I18nProvider'

// Light / dark. The choice is remembered in this browser; the first visit follows the device setting.
// (the <html class="dark"> flag is set before first paint by the script in app/layout.tsx)
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => obs.disconnect()
}

export default function ThemeToggle({ variant = 'dark', className = '' }: { variant?: 'dark' | 'light'; className?: string }) {
  const { t } = useI18n()
  // the <html class="dark"> flag is the single source of truth
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.classList.contains('dark'), () => false)

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch { /* private mode */ }
  }

  const tone =
    variant === 'dark'
      ? 'bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
      : 'border border-slate-300 bg-surface text-slate-700 hover:bg-slate-50'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={t('shell.theme')}
      title={t('shell.theme')}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition max-sm:h-11 max-sm:w-11 ${tone} ${className}`}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  )
}
