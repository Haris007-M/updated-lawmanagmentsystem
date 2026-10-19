import { MapPin } from 'lucide-react'
import { getI18n } from '@/lib/i18n'
import { APP_TZ } from '@/lib/tz'
import type { EventRow } from '@/lib/types'
import { Badge } from '@/components/Badge'
import EmptyState from '@/components/EmptyState'

// Read-only list of the events the lawyer shared with the client.
export default async function ClientEventList({
  events, caseTitles = {}, emptyTitle, emptyHint,
}: { events: EventRow[]; caseTitles?: Record<string, string>; emptyTitle?: string; emptyHint?: string }) {
  const { t, f, locale } = await getI18n()
  if (events.length === 0) return <EmptyState kind="calendar" title={emptyTitle ?? t('cl.appt.none')} hint={emptyHint ?? t('cl.appt.noneHint')} />
  const loc = locale === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB'
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((e) => {
        const d = new Date(e.starts_at)
        return (
          <li key={e.id} className="flex items-start gap-4 px-5 py-3.5">
            <div className="w-16 shrink-0 rounded-xl bg-brand-50 py-1.5 text-center" aria-hidden>
              <p className="text-xs font-medium text-brand-600">{d.toLocaleDateString(loc, { month: 'short', timeZone: APP_TZ })}</p>
              <p className="text-lg font-semibold leading-tight text-brand-900">{d.toLocaleDateString(loc, { day: '2-digit', timeZone: APP_TZ })}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{e.title}</p>
              <p className="text-xs text-slate-500">
                {f.dayLong(e.starts_at)} · {f.time(e.starts_at)}
                {e.case_id && caseTitles[e.case_id] ? ` · ${caseTitles[e.case_id]}` : ''}
              </p>
              {e.location && <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" aria-hidden />{e.location}</p>}
              {e.outcome && <p className="mt-1 text-xs text-slate-600">{t('cl.appt.outcome', { text: e.outcome })}</p>}
              <div className="mt-1.5">
                <Badge tone={e.kind === 'deadline' ? 'red' : e.kind === 'hearing' ? 'indigo' : 'blue'}>{t(`eventKind.${e.kind}`)}</Badge>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
