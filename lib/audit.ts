import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

// Append-only record of who did what. Never blocks the main action.
export async function audit(
  actorId: string | null,
  action: string,
  targetId?: string | null,
  meta?: Record<string, unknown>
) {
  const { error } = await createAdminClient()
    .from('audit_log')
    .insert({ actor_id: actorId, action, target_id: targetId ?? null, meta: meta ?? {} })
  if (error) console.error('audit failed:', error.message)
}
