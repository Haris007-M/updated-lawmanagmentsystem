import 'server-only'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'
import { allow } from '@/lib/rate-limit'
import { mailConfigured, sendNotificationEmail } from '@/lib/mail'

type Notice = {
  toUserId: string
  subject: string
  heading: string
  body: string
  path: string // e.g. /client/cases/<id>?tab=messages
  button?: string
  // at most one email per recipient per key per window (stops message floods)
  throttleKey?: string
  throttleSeconds?: number
}

// Fire-and-forget: the email is sent AFTER the response, never slows or breaks the action.
// Does nothing when SMTP is not configured or the person turned notifications off.
export async function notify(n: Notice): Promise<void> {
  if (!mailConfigured()) return
  const site = await getSiteUrl() // needs the request, so resolve it before `after`
  after(async () => {
    try {
      const admin = createAdminClient()
      const { data: r } = await admin
        .from('profiles')
        .select('email, full_name, notify_email, is_active')
        .eq('id', n.toUserId)
        .maybeSingle()
      if (!r || !r.is_active || !r.notify_email) return

      if (n.throttleKey && !(await allow(`notify:${n.throttleKey}:${n.toUserId}`, 1, n.throttleSeconds ?? 600))) {
        return
      }

      await sendNotificationEmail({
        to: r.email,
        name: r.full_name ?? r.email,
        subject: n.subject,
        heading: n.heading,
        body: n.body,
        link: `${site}${n.path}`,
        button: n.button ?? 'Open',
      })
    } catch (e) {
      console.error('notify failed:', e instanceof Error ? e.message : e)
    }
  })
}

// Tell every super admin something needs attention (e.g. a payment proof was submitted).
export async function notifyAdmins(n: Omit<Notice, 'toUserId'>): Promise<void> {
  if (!mailConfigured()) return
  const { data } = await createAdminClient().from('profiles').select('id').eq('role', 'super_admin').eq('is_active', true)
  for (const a of data ?? []) await notify({ ...n, toUserId: a.id })
}
