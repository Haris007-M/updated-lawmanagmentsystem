// Time zone handling. Event times are stored as real instants (UTC) and shown/entered in the
// firm's time zone (default Pakistan). Set NEXT_PUBLIC_TIMEZONE to change it.
export const APP_TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Karachi'

function partsInTz(date: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const o: Record<string, number> = {}
  for (const p of dtf.formatToParts(date)) if (p.type !== 'literal') o[p.type] = Number(p.value)
  return o
}

// minutes to ADD to UTC to get wall-clock time in `tz` at that instant
function offsetMinutes(date: Date, tz: string): number {
  const p = partsInTz(date, tz)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000)
}

// "2026-10-12T10:30" typed in the firm's time zone -> ISO instant
export function localToUtcISO(local: string, tz = APP_TZ): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  if (Number.isNaN(guess)) return null
  let t = guess - offsetMinutes(new Date(guess), tz) * 60000
  t = guess - offsetMinutes(new Date(t), tz) * 60000 // second pass settles DST edges
  return new Date(t).toISOString()
}

// stored instant -> "2026-10-12T10:30" for <input type="datetime-local">
export function utcToLocalInput(iso: string | null | undefined, tz = APP_TZ): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = partsInTz(d, tz)
  const z = (n: number) => String(n).padStart(2, '0')
  return `${p.year}-${z(p.month)}-${z(p.day)}T${z(p.hour)}:${z(p.minute)}`
}

// today's calendar date (YYYY-MM-DD) in the firm's time zone
export function todayISO(tz = APP_TZ): string {
  const p = partsInTz(new Date(), tz)
  const z = (n: number) => String(n).padStart(2, '0')
  return `${p.year}-${z(p.month)}-${z(p.day)}`
}

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// [start, end) instants of a calendar day in the firm's time zone
export function dayRangeUtc(date: string, tz = APP_TZ): { from: string; to: string } {
  const from = localToUtcISO(`${date}T00:00`, tz) ?? `${date}T00:00:00.000Z`
  const to = localToUtcISO(`${addDaysISO(date, 1)}T00:00`, tz) ?? `${addDaysISO(date, 1)}T00:00:00.000Z`
  return { from, to }
}

// calendar date (YYYY-MM-DD) of a stored instant in the firm's time zone
export function dateOfInstant(iso: string, tz = APP_TZ): string {
  return utcToLocalInput(iso, tz).slice(0, 10)
}
