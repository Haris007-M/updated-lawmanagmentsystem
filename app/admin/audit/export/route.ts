import { NextResponse, type NextRequest } from 'next/server'
import { getContext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getNames } from '@/lib/data'
import { toCsv } from '@/lib/csv'
import { cleanTerm } from '@/lib/paging'

// CSV of the audit log (newest first, at most 5,000 rows), optionally filtered by action. Super admin only.
export async function GET(request: NextRequest) {
  const me = await getContext()
  if (!me || me.role !== 'super_admin' || !me.access_active || !me.mfa_ok) return new NextResponse('Forbidden', { status: 403 })

  const term = cleanTerm(new URL(request.url).searchParams.get('q') ?? '')
  const supabase = await createClient()
  let q = supabase.from('audit_log').select('id, actor_id, action, target_id, meta, created_at').order('created_at', { ascending: false }).limit(5000)
  if (term) q = q.ilike('action', `%${term}%`)
  const { data } = await q
  const logs = (data ?? []) as { id: number; actor_id: string | null; action: string; target_id: string | null; meta: unknown; created_at: string }[]
  const names = await getNames(supabase, logs.flatMap((l) => [l.actor_id, l.target_id]))
  const label = (id: string | null) => (id ? names[id]?.full_name || names[id]?.email || id : '')

  const csv = toCsv(
    ['id', 'time_utc', 'actor', 'action', 'target', 'details'],
    logs.map((l) => [l.id, l.created_at, label(l.actor_id), l.action, label(l.target_id), JSON.stringify(l.meta ?? {})]),
  )
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
