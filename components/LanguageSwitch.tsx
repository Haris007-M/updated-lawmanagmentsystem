'use client'

import { useTransition } from 'react'
import { Languages } from 'lucide-react'
import { setLanguage } from '@/app/actions/language'
import { useI18n } from './I18nProvider'

// English <-> اردو. Stores a cookie and refreshes; the whole page flips to RTL for Urdu.
export default function LanguageSwitch({ variant = 'dark', className = '' }: { variant?: 'dark' | 'light'; className?: string }) {
  const { locale, t } = useI18n()
  const [pending, start] = useTransition()
  const next = locale === 'ur' ? 'en' : 'ur'
  const tone =
    variant === 'dark'
      ? 'bg-white/5 text-slate-700 hover:bg-white/10 hover:text-slate-900'
      : 'border border-slate-300 bg-surface text-slate-700 hover:bg-slate-50'
  return (
    <button
      type="button"
      disabled={pending}
      lang={next}
      aria-label={t('shell.language')}
      onClick={() => start(() => setLanguage(next))}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 max-sm:min-h-11 ${tone} ${className}`}
    >
      <Languages className="h-4 w-4" aria-hidden />
      {next === 'ur' ? t('shell.langUr') : t('shell.langEn')}
    </button>
  )
}
