import { APP_TZ } from '@/lib/tz'

export type Locale = 'en' | 'ur'

// Latin digits in both languages (that is how Pakistan writes dates, phone numbers and prices)
const INTL: Record<Locale, string> = { en: 'en-GB', ur: 'ur-PK-u-nu-latn' }

const isDateOnly = (v: string) => v.length === 10

export interface Formatters {
  /** 12 Oct 2026. Plain dates (YYYY-MM-DD) are never shifted by time zones. */
  date: (v: string | null | undefined) => string
  /** 12 Oct 2026, 10:30 in the firm's time zone */
  dateTime: (v: string | null | undefined) => string
  /** 10:30 */
  time: (v: string | null | undefined) => string
  /** Monday, 12 October */
  dayLong: (v: string | null | undefined) => string
  /** Rs 1,500 */
  money: (cents: number, currency: string) => string
  number: (n: number) => string
  /** 1h 30m */
  duration: (minutes: number) => string
}

export function makeFormatters(locale: Locale): Formatters {
  const loc = INTL[locale]
  const parse = (v: string | null | undefined) => {
    if (!v) return null
    const d = new Date(isDateOnly(v) ? `${v}T00:00:00Z` : v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return {
    date(v) {
      const d = parse(v)
      if (!d || !v) return '—'
      return d.toLocaleDateString(loc, {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: isDateOnly(v) ? 'UTC' : APP_TZ,
      })
    },
    dateTime(v) {
      const d = parse(v)
      if (!d) return '—'
      return d.toLocaleString(loc, {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: APP_TZ,
      })
    },
    time(v) {
      const d = parse(v)
      if (!d) return '—'
      return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: APP_TZ })
    },
    dayLong(v) {
      const d = parse(v)
      if (!d || !v) return '—'
      return d.toLocaleDateString(loc, {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: isDateOnly(v) ? 'UTC' : APP_TZ,
      })
    },
    money(cents, currency) {
      const whole = cents % 100 === 0
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency', currency, currencyDisplay: currency === 'PKR' ? 'code' : 'symbol',
          minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2,
        }).format(cents / 100).replace(/ /g, ' ')
      } catch {
        return `${currency} ${(cents / 100).toFixed(whole ? 0 : 2)}`
      }
    },
    number: (n) => new Intl.NumberFormat('en-US').format(n),
    duration(minutes) {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      if (!h) return `${m}m`
      return m ? `${h}h ${m}m` : `${h}h`
    },
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`
}

// Sum cents per currency: { PKR: 1000, USD: 500 }
export function sumByCurrency(rows: { amount_cents: number; currency: string }[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) out[r.currency] = (out[r.currency] ?? 0) + r.amount_cents
  return out
}

export function formatTotals(totals: Record<string, number>, money: Formatters['money']): string {
  const parts = Object.entries(totals).map(([cur, cents]) => money(cents, cur))
  return parts.length ? parts.join(' + ') : '—'
}

// money as typed in a form: 150000 cents -> "1500.00"
export const centsToInput = (cents: number): string => (cents / 100).toFixed(2)

// minutes -> hours as a decimal string, for totals ("1.50")
export const minutesToHours = (m: number): string => (m / 60).toFixed(2)

