import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import PrintButton from '@/components/PrintButton'
import { buttonCls, inputCls, labelCls, linkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { longDay } from '@/lib/lawyer-a-format'
import { first, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import { addDaysISO, dateOfInstant, dayRangeUtc, todayISO } from '@/lib/tz'
import type { EventRow } from '@/lib/types'

const RANGES = ['today', 'tomorrow', 'week', 'custom'] as const
type Range = (typeof RANGES)[number]
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime())

export default async function CauseListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t, f, locale } = await getI18n()
  const supabase = await createClient()

  const today = todayISO()
  const range: Range = RANGES.find((r) => r === first(sp.range)) ?? 'week'
  let from = today
  let to = today // inclusive
  if (range === 'tomorrow') { from = to = addDaysISO(today, 1) }
  else if (range === 'week') {
    const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7 // Monday = 0
    from = addDaysISO(today, -dow)
    to = addDaysISO(from, 6)
  } else if (range === 'custom') {
    const a = first(sp.from), b = first(sp.to)
    from = isDate(a) ? a : today
    to = isDate(b) ? b : addDaysISO(from, 6)
    if (to < from) to = from
    if (to > addDaysISO(from, 92)) to = addDaysISO(from, 92)
  }

  const { data } = await supabase.from('events').select('*')
    .eq('lawyer_id', me.firm_id).eq('kind', 'hearing')
    .gte('starts_at', dayRangeUtc(from).from).lt('starts_at', dayRangeUtc(to).to)
    .order('starts_at', { ascending: true }).limit(500)
  const hearings = (data ?? []) as EventRow[]

  const caseIds = [...new Set(hearings.map((h) => h.case_id).filter(Boolean) as string[])]
  const { data: caseRows } = caseIds.length
    ? await supabase.from('cases').select('id, case_number, title, court, court_case_number, judge, client_id, stage').in('id', caseIds)
    : { data: [] as { id: string; case_number: string; title: string; court: string | null; court_case_number: string | null; judge: string | null; client_id: string; stage: string | null }[] }
  const cases = Object.fromEntries((caseRows ?? []).map((c) => [c.id, c]))
  const names = await getNames(supabase, (caseRows ?? []).map((c) => c.client_id))

  const days = new Map<string, EventRow[]>()
  for (const h of hearings) {
    const d = dateOfInstant(h.starts_at)
    days.set(d, [...(days.get(d) ?? []), h])
  }

  const rangeText = from === to ? longDay(from, locale) : `${f.date(from)} – ${f.date(to)}`

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={t('nav.causeList')} description={t('la.cause.intro')} actions={<PrintButton />} />
        <form method="get" action="/lawyer/cause-list" className="mb-5 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="range" className={labelCls}>{t('la.cause.range')}</label>
            <select id="range" name="range" defaultValue={range} className={`${inputCls} !w-auto`}>
              <option value="today">{t('common.today')}</option>
              <option value="tomorrow">{t('common.tomorrow')}</option>
              <option value="week">{t('la.cause.thisWeek')}</option>
              <option value="custom">{t('la.cause.custom')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="from" className={labelCls}>{t('la.cause.from')}</label>
            <input id="from" name="from" type="date" defaultValue={range === 'custom' ? from : ''} className={`${inputCls} !w-auto`} />
          </div>
          <div>
            <label htmlFor="to" className={labelCls}>{t('la.cause.to')}</label>
            <input id="to" name="to" type="date" defaultValue={range === 'custom' ? to : ''} className={`${inputCls} !w-auto`} />
          </div>
          <button type="submit" className={buttonCls}>{t('list.filter')}</button>
          <p className="basis-full text-xs text-slate-500">{t('la.cause.customHint')}</p>
        </form>
      </div>

      <div className="print-sheet">
        <div className="mb-4 hidden print:block">
          <p className="text-lg font-semibold">{me.firm_name ?? ''}</p>
          <p className="text-sm">{t('nav.causeList')} · {rangeText}</p>
        </div>
        <p className="mb-3 text-sm font-medium text-slate-700 print:hidden">{rangeText} · {t('la.cause.count', { n: f.number(hearings.length) })}</p>

        {hearings.length === 0 ? (
          <Card><EmptyState kind="calendar" title={t('la.cause.none')} hint={t('la.cause.noneHint')} /></Card>
        ) : (
          <div className="space-y-5">
            {[...days.entries()].map(([day, list]) => (
              <Card key={day} title={longDay(day, locale)} padded={false} className="break-inside-avoid">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 print:bg-transparent">
                      <tr className="text-start text-xs text-slate-500">
                        <th scope="col" className="px-4 py-2 text-start font-medium">{t('la.cause.time')}</th>
                        <th scope="col" className="px-4 py-2 text-start font-medium">{t('la.cause.caseNo')}</th>
                        <th scope="col" className="px-4 py-2 text-start font-medium">{t('common.case')}</th>
                        <th scope="col" className="px-4 py-2 text-start font-medium">{t('la.case.court')}</th>
                        <th scope="col" className="px-4 py-2 text-start font-medium">{t('la.case.judge')}</th>
                        <th scope="col" className="px-4 py-2 text-start font-medium">{t('common.client')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((h) => {
                        const c = h.case_id ? cases[h.case_id] : undefined
                        return (
                          <tr key={h.id} className="align-top">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{f.time(h.starts_at)}</td>
                            <td className="px-4 py-3" dir="ltr">
                              <span className="font-medium">{c?.court_case_number || '—'}</span>
                              {c && <p className="text-xs text-slate-500">{c.case_number}</p>}
                            </td>
                            <td className="px-4 py-3">
                              {c ? <Link href={`/lawyer/cases/${c.id}?tab=schedule`} className={`${linkCls} print:no-underline`}>{c.title}</Link> : h.title}
                              {c && h.title !== c.title && <p className="text-xs text-slate-500">{h.title}</p>}
                              {c?.stage && <p className="text-xs text-slate-500">{c.stage}</p>}
                            </td>
                            <td className="px-4 py-3">{h.location || c?.court || '—'}</td>
                            <td className="px-4 py-3">{c?.judge || '—'}</td>
                            <td className="px-4 py-3">{c ? nameOf(names, c.client_id, t('common.unknown')) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
