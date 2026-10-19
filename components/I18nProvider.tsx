'use client'

import { createContext, useContext, useMemo } from 'react'
import { makeT, type TFunction } from '@/lib/i18n/shared'
import type { Locale } from '@/lib/format'

interface Ctx { locale: Locale; t: TFunction }
const I18nContext = createContext<Ctx>({ locale: 'en', t: (k) => k })

// Gives client components the same translator the server components use:  const { t } = useI18n()
export default function I18nProvider({
  locale, dict, children,
}: { locale: Locale; dict: Record<string, string>; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: makeT(dict, {}) }), [locale, dict])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
