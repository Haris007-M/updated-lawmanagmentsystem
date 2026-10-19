// Turns raw dates into small number series for the stat-card charts.
// All maths is in UTC so server and browser always agree.
const DAY = 86_400_000

const toTime = (v: string): number => new Date(v.length === 10 ? `${v}T00:00:00Z` : v).getTime()

function startOfWeekUTC(d: Date): number {
  const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return t - ((new Date(t).getUTCDay() + 6) % 7) * DAY // Monday
}

// How many dates fall in each of the last `weeks` weeks (oldest first).
export function weekly(dates: (string | null | undefined)[], weeks = 8): number[] {
  const start = startOfWeekUTC(new Date()) - (weeks - 1) * 7 * DAY
  const out = new Array<number>(weeks).fill(0)
  for (const v of dates) {
    if (!v) continue
    const t = toTime(v)
    if (Number.isNaN(t)) continue
    const i = Math.floor((t - start) / (7 * DAY))
    if (i >= 0 && i < weeks) out[i]++
  }
  return out
}

// Running total at the end of each of the last `weeks` weeks (includes everything before the window).
export function cumulativeWeekly(dates: (string | null | undefined)[], weeks = 8): number[] {
  const start = startOfWeekUTC(new Date()) - (weeks - 1) * 7 * DAY
  let before = 0
  for (const v of dates) {
    if (!v) continue
    const t = toTime(v)
    if (!Number.isNaN(t) && t < start) before++
  }
  const per = weekly(dates, weeks)
  let run = before
  return per.map((n) => (run += n))
}

// How many dates fall on each of the next `days` days, starting today.
export function nextDays(dates: (string | null | undefined)[], days = 7): number[] {
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())
  const out = new Array<number>(days).fill(0)
  for (const v of dates) {
    if (!v) continue
    const t = toTime(v)
    if (Number.isNaN(t)) continue
    const i = Math.floor((t - today) / DAY)
    if (i >= 0 && i < days) out[i]++
  }
  return out
}

export const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)
