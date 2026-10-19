import { NextResponse, type NextRequest } from 'next/server'
import { getContext } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { toCsv, type CsvCell } from '@/lib/csv'
import { allow } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

const LIMIT = 20000
type Row = Record<string, CsvCell>

const SPECS = {
  clients: {
    table: 'profiles', order: 'created_at',
    cols: ['full_name', 'email', 'phone', 'is_active', 'created_at'],
    filter: (q: any, firm: string) => q.eq('lawyer_id', firm).eq('role', 'client'), // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  cases: {
    table: 'cases', order: 'created_at',
    cols: ['case_number', 'title', 'case_type', 'status', 'court', 'court_case_number', 'judge', 'stage', 'opposing_party', 'client_id', 'opened_on', 'closed_on', 'description'],
    filter: (q: any, firm: string) => q.eq('lawyer_id', firm), // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  invoices: {
    table: 'invoices', order: 'created_at',
    cols: ['number', 'client_id', 'case_id', 'description', 'amount_cents', 'currency', 'status', 'issued_on', 'due_on', 'paid_on'],
    filter: (q: any, firm: string) => q.eq('lawyer_id', firm), // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  time: {
    table: 'time_entries', order: 'entry_date',
    cols: ['entry_date', 'case_id', 'user_id', 'minutes', 'description', 'billable', 'rate_cents', 'invoiced_invoice_id'],
    filter: (q: any, firm: string) => q.eq('lawyer_id', firm), // eslint-disable-line @typescript-eslint/no-explicit-any
  },
} as const
type Kind = keyof typeof SPECS

// Owner-only data export. Row level security still applies (the user's own session is used).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params
  const me = await getContext()
  if (!me || !me.access_active || !me.mfa_ok) return new NextResponse('Unauthorized', { status: 401 })
  if (me.role !== 'lawyer' || !me.firm_id) return new NextResponse('Forbidden', { status: 403 })
  if (kind !== 'all' && !(kind in SPECS)) return new NextResponse('Not found', { status: 404 })
  if (!(await allow(`export:${me.id}`, 10, 3600))) return new NextResponse('Too many exports, try later', { status: 429 })

  const sb = await createClient()
  const load = async (k: Kind): Promise<Row[]> => {
    const s = SPECS[k]
    const q = s.filter(sb.from(s.table).select(s.cols.join(',')), me.firm_id!).order(s.order, { ascending: false }).limit(LIMIT)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as Row[]
  }

  try {
    const stamp = new Date().toISOString().slice(0, 10)
    let res: NextResponse
    if (kind === 'all') {
      const out: Record<string, Row[]> = {}
      for (const k of Object.keys(SPECS) as Kind[]) out[k] = await load(k)
      res = new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), ...out }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="lexdesk-export-${stamp}.json"` },
      })
    } else {
      const k = kind as Kind
      const rows = await load(k)
      const cols = SPECS[k].cols as readonly string[]
      res = new NextResponse(toCsv([...cols], rows.map((r) => cols.map((c) => r[c]))), {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="lexdesk-${k}-${stamp}.csv"` },
      })
    }
    res.headers.set('Cache-Control', 'no-store')
    await audit(me.id, `export.${kind}`, me.firm_id)
    return res
  } catch (e) {
    console.error('export failed:', e)
    return new NextResponse('Export failed', { status: 500 })
  }
}
