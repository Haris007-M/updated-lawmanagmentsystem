import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { en } from './dict/en'
import { ur } from './dict/ur'
import { makeFormatters, type Formatters, type Locale } from '@/lib/format'
import { makeT, type TFunction } from './shared'

export { LOCALES, DIRECTION, type TKey } from './shared'
export type { Locale, TFunction }

const DICTS = { en, ur } as const

export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get('lang')?.value
  return c === 'ur' ? 'ur' : 'en'
})

export interface I18n {
  locale: Locale
  dir: 'ltr' | 'rtl'
  t: TFunction
  f: Formatters
  dict: Record<string, string>
}

// Usage in a server component:  const { t, f } = await getI18n()
export const getI18n = cache(async (): Promise<I18n> => {
  const locale = await getLocale()
  const dict = DICTS[locale] as Record<string, string>
  return {
    locale,
    dir: locale === 'ur' ? 'rtl' : 'ltr',
    t: makeT(dict, en as Record<string, string>),
    f: makeFormatters(locale),
    dict,
  }
})
