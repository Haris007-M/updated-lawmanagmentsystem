import 'server-only'
import { createClient } from '@/lib/supabase/server'

type Sb = Awaited<ReturnType<typeof createClient>>

export interface Person { id: string; name: string; email: string }

const toPerson = (p: { id: string; full_name: string | null; email: string }): Person => ({
  id: p.id, name: p.full_name || p.email, email: p.email,
})

// The firm's active clients (for pickers). Limited: a picker with 1000 people is not a picker.
export async function firmClients(supabase: Sb, firmId: string, limit = 500): Promise<Person[]> {
  const { data } = await supabase
    .from('profiles').select('id, full_name, email')
    .eq('role', 'client').eq('lawyer_id', firmId).eq('is_active', true)
    .order('full_name').limit(limit)
  return (data ?? []).map(toPerson)
}

// The firm's lawyer-owner and juniors (task assignees).
export async function firmStaff(supabase: Sb, firmId: string): Promise<Person[]> {
  const [{ data: owner }, { data: juniors }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('id', firmId).maybeSingle(),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'junior').eq('lawyer_id', firmId).eq('is_active', true).order('full_name'),
  ])
  return [...(owner ? [toPerson(owner)] : []), ...(juniors ?? []).map(toPerson)]
}

export const personMap = (list: Person[]) =>
  Object.fromEntries(list.map((p) => [p.id, { full_name: p.name, email: p.email }]))

export interface CaseOption { id: string; title: string; case_number: string }

// Open cases for pickers
export async function firmCaseOptions(supabase: Sb, firmId: string, limit = 400): Promise<CaseOption[]> {
  const { data } = await supabase
    .from('cases').select('id, title, case_number').eq('lawyer_id', firmId)
    .neq('status', 'closed').order('updated_at', { ascending: false }).limit(limit)
  return (data ?? []) as CaseOption[]
}

// The next upcoming hearing of each given case (one query).
export async function nextHearingByCase(supabase: Sb, firmId: string, caseIds: string[]): Promise<Record<string, string>> {
  if (caseIds.length === 0) return {}
  const { data } = await supabase
    .from('events').select('case_id, starts_at')
    .eq('lawyer_id', firmId).eq('kind', 'hearing').gte('starts_at', new Date().toISOString())
    .in('case_id', caseIds).order('starts_at', { ascending: true }).limit(caseIds.length * 3)
  const out: Record<string, string> = {}
  for (const e of (data ?? []) as { case_id: string; starts_at: string }[]) if (!out[e.case_id]) out[e.case_id] = e.starts_at
  return out
}
