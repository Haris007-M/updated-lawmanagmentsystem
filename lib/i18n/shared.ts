import type { en } from './dict/en'

export const LOCALES = ['en', 'ur'] as const
export const DIRECTION = { en: 'ltr', ur: 'rtl' } as const

// every key that exists in the English dictionary (the compiler checks the Urdu one matches)
export type TKey = keyof typeof en
export type TFunction = (key: TKey, vars?: Record<string, string | number>) => string

// Falls back to English, then to the key itself, so a missing translation never crashes a page.
export function makeT(dict: Record<string, string>, fallback: Record<string, string>): TFunction {
  return (key, vars) => {
    let s = dict[key] ?? fallback[key] ?? key
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
    return s
  }
}
