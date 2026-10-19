export const getStr = (fd: FormData, key: string, max = 500): string =>
  String(fd.get(key) ?? '').trim().slice(0, max)

export function getEnum<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const v = getStr(fd, key, 60)
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

export const isUuid = (v: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

// "2026-10-12" -> same string, anything else -> null
export function getDate(fd: FormData, key: string): string | null {
  const v = getStr(fd, key, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ? v : null
}

// <input type="datetime-local"> "2026-10-12T10:30" -> ISO string (treated as UTC wall clock)
export function getDateTime(fd: FormData, key: string): string | null {
  const v = getStr(fd, key, 16)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null
  const d = new Date(`${v}:00Z`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// "1,250.50" -> 125050 (cents). null if invalid or not positive.
export function getMoneyCents(fd: FormData, key: string): number | null {
  const raw = getStr(fd, key, 20).replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null
  const cents = Math.round(parseFloat(raw) * 100)
  return cents > 0 && cents < 1_000_000_000_00 ? cents : null
}

export function dbError(error: { code?: string; message: string }): string {
  if (error.code === '42501') return 'You do not have permission to do that.'
  if (error.code === '23505') return 'That already exists.'
  if (error.code === '23514' || error.code === '22P02') return 'One of the values is not allowed.'
  console.error('database error', error.code, error.message)
  return error.message.length < 120 && error.code === 'P0001'
    ? error.message
    : 'Something went wrong. Please try again.'
}
