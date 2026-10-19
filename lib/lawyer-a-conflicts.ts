import 'server-only'
import { cleanTerm } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'

type Sb = Awaited<ReturnType<typeof createClient>>

export interface ConflictHit {
  kind: 'client' | 'opposing' | 'title'
  caseId?: string
  clientId?: string
  label: string        // the name that matched
  caseNumber?: string
  caseTitle?: string
  otherParty?: string  // for 'opposing': the client of that case
  status?: string
}

// Conflict-of-interest search across the firm's own clients and cases:
//  - clients whose name/email matches        ("the other side is already your client")
//  - cases whose opposing party matches      ("you have acted against this party")
//  - cases whose title matches
// RLS limits everything to the firm, so this can never see another firm's data.
export async function searchConflicts(supabase: Sb, rawTerms: string[]): Promise<ConflictHit[]> {
  const terms = [...new Set(rawTerms.map((x) => cleanTerm(x, 60)).filter((x) => x.length >= 3))].slice(0, 4)
  if (terms.length === 0) return []
  const hits: ConflictHit[] = []
  const seen = new Set<string>()

  for (const term of terms) {
    const [clients, opposing, titles] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('role', 'client')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`).limit(10),
      supabase.from('cases').select('id, case_number, title, status, opposing_party, client_id')
        .ilike('opposing_party', `%${term}%`).limit(15),
      supabase.from('cases').select('id, case_number, title, status, client_id')
        .ilike('title', `%${term}%`).limit(10),
    ])
    const ids = [...new Set([...(opposing.data ?? []), ...(titles.data ?? [])].map((c) => c.client_id))]
    const nameRows = ids.length ? (await supabase.from('profiles').select('id, full_name, email').in('id', ids)).data ?? [] : []
    const nm = Object.fromEntries(nameRows.map((p) => [p.id, p.full_name || p.email]))

    for (const c of clients.data ?? []) {
      const key = `c:${c.id}`
      if (!seen.has(key)) { seen.add(key); hits.push({ kind: 'client', clientId: c.id, label: c.full_name || c.email }) }
    }
    for (const c of opposing.data ?? []) {
      const key = `o:${c.id}`
      if (!seen.has(key)) {
        seen.add(key)
        hits.push({ kind: 'opposing', caseId: c.id, label: c.opposing_party ?? '', caseNumber: c.case_number, caseTitle: c.title, otherParty: nm[c.client_id], status: c.status })
      }
    }
    for (const c of titles.data ?? []) {
      const key = `t:${c.id}`
      if (!seen.has(key)) {
        seen.add(key)
        hits.push({ kind: 'title', caseId: c.id, label: c.title, caseNumber: c.case_number, caseTitle: c.title, otherParty: nm[c.client_id], status: c.status })
      }
    }
  }
  return hits
}
