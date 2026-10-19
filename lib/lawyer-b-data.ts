import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { FirmPrefs, FirmSettings } from '@/lib/types'

type Sb = Awaited<ReturnType<typeof createClient>>

export const FIRM_COLS = 'firm_id, firm_name, address, phone, email, ntn, bank_details, invoice_terms, letter_footer'

export async function loadFirmSettings(sb: Sb, firmId: string): Promise<FirmSettings | null> {
  const { data } = await sb.from('firm_settings').select(FIRM_COLS).eq('firm_id', firmId).maybeSingle()
  return (data as FirmSettings | null) ?? null
}

export async function loadFirmPrefs(sb: Sb, firmId: string): Promise<FirmPrefs> {
  const { data } = await sb.from('firm_prefs').select('firm_id, default_currency, hourly_rate_cents, default_due_days, onboarded_at').eq('firm_id', firmId).maybeSingle()
  return (data as FirmPrefs | null) ?? { firm_id: firmId, default_currency: 'PKR', hourly_rate_cents: 0, default_due_days: 14, onboarded_at: null }
}

export interface CaseOpt { id: string; case_number: string; title: string; client_id: string }

// The firm's cases for a picker (newest first, capped)
export async function loadCaseOptions(sb: Sb, openOnly = false, limit = 400): Promise<CaseOpt[]> {
  let q = sb.from('cases').select('id, case_number, title, client_id').order('created_at', { ascending: false }).limit(limit)
  if (openOnly) q = q.neq('status', 'closed')
  const { data } = await q
  return (data ?? []) as CaseOpt[]
}

export interface PersonOpt { id: string; full_name: string | null; email: string; phone: string | null }

export async function loadClientOptions(sb: Sb, limit = 500): Promise<PersonOpt[]> {
  const { data } = await sb.from('profiles').select('id, full_name, email, phone').eq('role', 'client').eq('is_active', true).order('full_name').limit(limit)
  return (data ?? []) as PersonOpt[]
}
