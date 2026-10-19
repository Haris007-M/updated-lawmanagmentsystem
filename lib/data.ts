import { createClient } from '@/lib/supabase/server'

type Sb = Awaited<ReturnType<typeof createClient>>
export type NameMap = Record<string, { full_name: string | null; email: string }>

// Looks up display names. Goes through RLS, so you only ever get people you may see.
export async function getNames(supabase: Sb, ids: (string | null | undefined)[]): Promise<NameMap> {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))]
  if (unique.length === 0) return {}
  const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', unique)
  const map: NameMap = {}
  for (const p of (data ?? []) as { id: string; full_name: string | null; email: string }[]) {
    map[p.id] = { full_name: p.full_name, email: p.email }
  }
  return map
}

export const nameOf = (map: NameMap, id: string | null | undefined, fallback = '—'): string =>
  (id && (map[id]?.full_name || map[id]?.email)) || fallback
