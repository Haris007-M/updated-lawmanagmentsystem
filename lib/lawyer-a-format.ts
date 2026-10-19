import { APP_TZ } from '@/lib/tz'
import type { Locale } from '@/lib/format'

const INTL: Record<Locale, string> = { en: 'en-GB', ur: 'ur-PK-u-nu-latn' }

// Small "Oct / 12" calendar tile for an instant, in the firm's time zone.
export function dayTile(iso: string, locale: Locale): { mon: string; day: string } {
  const d = new Date(iso)
  const loc = INTL[locale]
  return {
    mon: d.toLocaleDateString(loc, { month: 'short', timeZone: APP_TZ }),
    day: d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: APP_TZ }),
  }
}

// "Monday, 12 October" for a plain YYYY-MM-DD
export function longDay(date: string, locale: Locale): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(INTL[locale], {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

// "October 2026" for YYYY-MM
export function monthLabel(ym: string, locale: Locale): string {
  return new Date(`${ym}-01T00:00:00Z`).toLocaleDateString(INTL[locale], { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

import type { TFunction, TKey } from '@/lib/i18n/shared'

// Case types are stored in English; show them translated (unknown custom values are shown as typed).
export function caseTypeLabel(t: TFunction, v: string): string {
  const k = `caseType.${v}` as TKey
  const r = t(k)
  return r === k ? v : r
}
