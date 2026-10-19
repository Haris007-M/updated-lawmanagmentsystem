import { getStr } from '@/lib/form'

// "1,250.50" -> 125050 (cents). Zero is allowed (for "no rate set"). null if invalid.
export function getMoneyCentsAllowZero(fd: FormData, key: string): number | null {
  const raw = getStr(fd, key, 20).replace(/,/g, '')
  if (raw === '') return 0
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null
  const cents = Math.round(parseFloat(raw) * 100)
  return cents >= 0 && cents < 1_000_000_000_00 ? cents : null
}

export const clean = (v: string | undefined | null, max = 120) => (v ?? '').replace(/[,()%*\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)

// a YYYY-MM-DD query parameter, or ''
export const dateParam = (v: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')

// big, unmistakable upper bound for "load the rows of a filter to total them"
export const TOTALS_LIMIT = 5000
