'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/rate-limit'
import { notify } from '@/lib/notify'
import { dbError, getStr, isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import type { ActionState } from '@/lib/types'

// Used by firm staff AND the client. Row level security decides whether the caller really belongs to this case.
export async function postMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const me = await requireUser()
  if (me.role !== 'lawyer' && me.role !== 'junior' && me.role !== 'client') return { error: t('common.error.notAllowed') }

  const caseId = getStr(formData, 'case_id', 40)
  const body = getStr(formData, 'body', 4000)
  if (!isUuid(caseId)) return { error: t('msgs.err.notFound') }
  if (!body) return { error: t('msgs.err.empty') }
  if (!(await allow(`message:${me.id}`, 60, 3600))) return { error: t('msgs.err.tooFast') }

  const supabase = await createClient()
  const { error } = await supabase.from('case_messages').insert({ case_id: caseId, author_id: me.id, body })
  if (error) return { error: dbError(error) }

  // tell the OTHER side (one email per 10 minutes per case, no message text in the email)
  const { data: c } = await supabase.from('cases').select('lawyer_id, client_id, case_number').eq('id', caseId).maybeSingle()
  if (c) {
    const toClient = me.id !== c.client_id
    await notify({
      toUserId: toClient ? c.client_id : c.lawyer_id,
      subject: `New message on case ${c.case_number}`,
      heading: 'New message',
      body: `You have a new message on case ${c.case_number}. Sign in to read it.`,
      path: `/${toClient ? 'client' : 'lawyer'}/cases/${caseId}?tab=messages`,
      button: 'Read message',
      throttleKey: `msg:${caseId}`,
    })
  }

  revalidatePath(`/lawyer/cases/${caseId}`)
  revalidatePath(`/client/cases/${caseId}`)
  return { success: t('msgs.sent') }
}
