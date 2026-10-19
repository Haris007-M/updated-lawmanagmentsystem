import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlan } from '@/lib/plans'
import type { TKey } from '@/lib/i18n/shared'

export interface Usage {
  plan: string
  juniors: number
  clients: number
  storageBytes: number
  maxJuniors: number
  maxClients: number
  maxStorageBytes: number
}

// How much of the plan a firm has used. Service-role read; callers must have verified the caller is staff of that firm.
export async function firmUsage(firmId: string): Promise<Usage> {
  const admin = createAdminClient()
  const [{ data: sub }, juniors, clients, docs] = await Promise.all([
    admin.from('subscriptions').select('plan').eq('firm_id', firmId).maybeSingle(),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('lawyer_id', firmId).eq('role', 'junior'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('lawyer_id', firmId).eq('role', 'client'),
    admin.rpc('firm_storage_bytes', { p_firm: firmId }),
  ])
  const plan = getPlan(sub?.plan)
  return {
    plan: plan.id,
    juniors: juniors.count ?? 0,
    clients: clients.count ?? 0,
    storageBytes: Number(docs.data ?? 0),
    maxJuniors: plan.maxJuniors,
    maxClients: plan.maxClients,
    maxStorageBytes: plan.storageGb * 1024 ** 3,
  }
}

// Returns a translation key if the firm cannot add one more of this kind on its plan.
export async function limitError(firmId: string, kind: 'junior' | 'client'): Promise<TKey | null> {
  const u = await firmUsage(firmId)
  if (kind === 'junior' && u.juniors >= u.maxJuniors) return 'msg.limit.juniors'
  if (kind === 'client' && u.clients >= u.maxClients) return 'msg.limit.clients'
  return null
}
