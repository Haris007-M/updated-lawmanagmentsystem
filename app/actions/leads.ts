'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { allow, clientIp } from '@/lib/rate-limit'
import { notifyAdmins } from '@/lib/notify'
import { getStr } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { PLANS, type PlanId } from '@/lib/plans'
import type { ActionState } from '@/lib/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Public form (no sign-in): honeypot + per-IP and global rate limits, validated, saved with the service role.
export async function submitLead(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getI18n()
  const name = getStr(fd, 'name', 120)
  const firm = getStr(fd, 'firm', 160)
  const phone = getStr(fd, 'phone', 40)
  const email = getStr(fd, 'email', 254).toLowerCase()
  const city = getStr(fd, 'city', 80)
  const plan = getStr(fd, 'plan', 20)
  const message = getStr(fd, 'message', 1500)
  const fields = { name, firm, phone, email, city, plan, message }

  // bots fill the hidden field; pretend it worked
  if (getStr(fd, 'website', 100)) return { success: 'ok' }

  if (!name) return { error: t('site.contact.needName'), fields }
  if (!phone && !email) return { error: t('site.contact.needOne'), fields }
  if (email && (!EMAIL_RE.test(email))) return { error: t('site.contact.badEmail'), fields }
  if (fd.get('consent') !== 'on') return { error: t('site.contact.needConsent'), fields }

  const ip = await clientIp()
  if (!(await allow(`lead:ip:${ip}`, 5, 3600)) || !(await allow('lead:all', 300, 86400))) {
    return { error: t('site.contact.tooMany'), fields }
  }

  const planName = plan in PLANS ? PLANS[plan as PlanId].name : ''
  const body = [planName ? `[Plan: ${planName}]` : '', message].filter(Boolean).join(' ')

  const { error } = await createAdminClient().from('leads').insert({
    name,
    email: email || null,
    phone: phone || null,
    firm_name: firm || null,
    city: city || null,
    message: body || null,
  })
  if (error) {
    console.error('lead insert failed:', error.message)
    return { error: t('site.contact.fail'), fields }
  }

  await notifyAdmins({
    subject: 'New trial request',
    heading: 'New trial request',
    body: `${name}${firm ? ` (${firm})` : ''} asked for a trial. Open the leads list to follow up.`,
    path: '/admin/leads',
    button: 'Open leads',
    throttleKey: 'lead',
    throttleSeconds: 300,
  })
  return { success: 'ok' }
}
