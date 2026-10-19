import { CalendarClock } from 'lucide-react'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { requireRole } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/types'
import ClientEventList from '../_components/ClientEventList'

const COLS = 'id, lawyer_id, case_id, title, kind, starts_at, location, notes, outcome, visible_to_client, created_at'

export default async function ClientAppointmentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireRole('client')
  const { t, f } = await getI18n()
  const p = readPaging(await searchParams, 15)
  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  // only shared events come back (row level security); past ones are paged
  const [upRes, pastRes, casesRes] = await Promise.all([
    supabase.from('events').select(COLS).eq('visible_to_client', true).gte('starts_at', nowIso).order('starts_at', { ascending: true }).limit(100),
    supabase.from('events').select(COLS, { count: 'exact' }).eq('visible_to_client', true).lt('starts_at', nowIso).order('starts_at', { ascending: false }).range(p.from, p.to),
    supabase.from('cases').select('id, title').eq('client_id', me.id).limit(200),
  ])
  const upcoming = (upRes.data ?? []) as EventRow[]
  const past = (pastRes.data ?? []) as EventRow[]
  const caseTitles = Object.fromEntries((casesRes.data ?? []).map((c) => [c.id, c.title]))
  const hearing = upcoming.find((e) => e.kind === 'hearing')

  return (
    <>
      <PageHeader title={t('cl.appt.title')} description={t('cl.appt.desc')} />
      {hearing && (
        <section aria-label={t('cl.appt.nextHearing')} className="mb-6 flex items-center gap-4 rounded-xl border border-gold-200 bg-gold-50 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-on-gold"><CalendarClock className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gold-700">{t('cl.appt.nextHearing')}</p>
            <p className="text-sm font-semibold text-slate-900">{hearing.title}{hearing.case_id && caseTitles[hearing.case_id] ? ` · ${caseTitles[hearing.case_id]}` : ''}</p>
            <p className="text-sm text-slate-700">{t('cl.nextHearing.on', { date: f.dayLong(hearing.starts_at), time: f.time(hearing.starts_at) })}{hearing.location ? ` · ${hearing.location}` : ''}</p>
          </div>
        </section>
      )}
      <div className="space-y-6">
        <Card title={t('cl.appt.upcoming')} padded={false}>
          <ClientEventList events={upcoming} caseTitles={caseTitles} />
        </Card>
        {(past.length > 0 || p.page > 1) && (
          <Card title={t('cl.appt.past')} padded={false}>
            <ClientEventList events={past} caseTitles={caseTitles} />
            <Pagination total={pastRes.count ?? 0} page={p.page} size={p.size} basePath="/client/appointments" />
          </Card>
        )}
      </div>
    </>
  )
}
