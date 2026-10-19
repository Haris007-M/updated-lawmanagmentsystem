import 'server-only'
import type { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/types'

type Sb = Awaited<ReturnType<typeof createClient>>

// The next upcoming hearing the lawyer SHARED, per case (row level security already hides private events).
export async function nextHearings(supabase: Sb, caseIds: string[]): Promise<Record<string, EventRow>> {
  if (caseIds.length === 0) return {}
  const { data } = await supabase
    .from('events')
    .select('id, case_id, title, kind, starts_at, location, notes, outcome, visible_to_client, lawyer_id, created_at')
    .in('case_id', caseIds)
    .eq('kind', 'hearing')
    .eq('visible_to_client', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(200)
  const out: Record<string, EventRow> = {}
  for (const e of (data ?? []) as EventRow[]) if (e.case_id && !out[e.case_id]) out[e.case_id] = e
  return out
}
