import { PAGE_SIZE } from '@/lib/constants'

export type SearchParams = Record<string, string | string[] | undefined>

export const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? '' : v ?? '')

// strip characters that have a meaning inside a PostgREST filter string
export function cleanTerm(v: string | undefined, max = 80): string {
  return (v ?? '').replace(/[,()%*\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

// "col1.ilike.%term%,col2.ilike.%term%" for query.or(...)
export function ilikeOr(columns: string[], term: string): string {
  return columns.map((c) => `${c}.ilike.%${term}%`).join(',')
}

export interface Paging {
  page: number
  size: number
  from: number
  to: number // inclusive, for supabase .range(from, to)
  q: string
}

export function readPaging(sp: SearchParams, size = PAGE_SIZE): Paging {
  const page = Math.max(1, Math.min(10_000, parseInt(first(sp.page), 10) || 1))
  const from = (page - 1) * size
  return { page, size, from, to: from + size - 1, q: cleanTerm(first(sp.q)) }
}
