import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'
import { mailConfigured } from '@/lib/mail'
import { loadSubscriptions, lockedFirms, runSubscriptionJob } from '@/lib/cron-subscriptions'
import { runReminderJob } from '@/lib/cron-reminders'

// The one daily job (see vercel.json or .github/workflows/daily.yml). Safe to run more than once a day.
//  1. stores the real subscription status (past due / suspended) and emails the firm owner
//  2. emails tomorrow's hearings, meetings, deadlines and due tasks
//  3. prunes old rate-limit records
// Protected by CRON_SECRET (Authorization: Bearer <secret>).
// Access is ALSO enforced without this job: the database computes the real subscription state on every request.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false
  const a = Buffer.from(request.headers.get('authorization') ?? '')
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function run(request: NextRequest) {
  if (!authorised(request)) return new NextResponse('Unauthorized', { status: 401 })

  const site = await getSiteUrl()
  const summary: Record<string, unknown> = { ok: true, mail: mailConfigured() ? 'on' : 'SMTP not configured: emails skipped' }
  try {
    const subs = await loadSubscriptions()
    summary.subscriptions = await runSubscriptionJob(subs, site)
    summary.reminders = await runReminderJob(lockedFirms(subs), site)

    const cutoff = new Date(Date.now() - 86_400_000).toISOString()
    const { error } = await createAdminClient().from('rate_limits').delete().lt('hit_at', cutoff)
    summary.rateLimitsPruned = !error
  } catch (e) {
    console.error('daily cron failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ ...summary, ok: false, error: 'job failed, see server logs' }, { status: 500 })
  }
  return NextResponse.json(summary)
}

export const GET = run
export const POST = run
