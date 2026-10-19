import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import EventList from '@/components/EventList'
import PageHeader from '@/components/PageHeader'
import { Checkbox, Field, Select, TextArea } from '@/components/Field'
import { buttonCls, inputCls, smallBtnCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { EVENT_KINDS } from '@/lib/constants'
import { getI18n } from '@/lib/i18n'
import { firmCaseOptions } from '@/lib/lawyer-a-data'
import { addMonths, longDay, monthLabel } from '@/lib/lawyer-a-format'
import { first, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import { addDaysISO, dateOfInstant, dayRangeUtc, todayISO } from '@/lib/tz'
import type { EventRow } from '@/lib/types'
import { addEvent } from '../practice-actions'

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

export default async function CalendarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t, locale } = await getI18n()
  const supabase = await createClient()

  const today = todayISO()
  const view = first(sp.view) === 'month' ? 'month' : 'agenda'
  const mRaw = first(sp.m)
  const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(mRaw) ? mRaw : today.slice(0, 7)
  const kind = EVENT_KINDS.find((k) => k === first(sp.kind)) ?? ''
  const caseFilter = isUuid(first(sp.case)) ? first(sp.case) : ''
  const dayRaw = first(sp.day)
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(dayRaw) && dayRaw.startsWith(ym) ? dayRaw : (today.startsWith(ym) ? today : '')

  const monthFirst = `${ym}-01`
  const monthLast = addDaysISO(`${addMonths(ym, 1)}-01`, -1)
  let query = supabase.from('events').select('*').eq('lawyer_id', me.firm_id)
    .gte('starts_at', dayRangeUtc(monthFirst).from).lt('starts_at', dayRangeUtc(monthLast).to)
    .order('starts_at', { ascending: true }).limit(500)
  if (kind) query = query.eq('kind', kind)
  if (caseFilter) query = query.eq('case_id', caseFilter)

  const [{ data }, cases] = await Promise.all([query, firmCaseOptions(supabase, me.firm_id)])
  const events = (data ?? []) as EventRow[]
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))

  const byDay = new Map<string, EventRow[]>()
  for (const e of events) {
    const d = dateOfInstant(e.starts_at)
    byDay.set(d, [...(byDay.get(d) ?? []), e])
  }

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams({ view, m: ym, ...(kind ? { kind } : {}), ...(caseFilter ? { case: caseFilter } : {}), ...over })
    return `/lawyer/calendar?${p.toString()}`
  }

  // month grid (weeks start on Monday)
  const startDow = (new Date(`${monthFirst}T00:00:00Z`).getUTCDay() + 6) % 7
  const daysInMonth = Number(monthLast.slice(8, 10))
  const cells: (string | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`),
  ]
  while (cells.length % 7) cells.push(null)
  const wdFmt = new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { weekday: 'short', timeZone: 'UTC' })
  const weekdays = Array.from({ length: 7 }, (_, i) => wdFmt.format(new Date(Date.UTC(2024, 0, 1 + i))))

  const dayEvents = selectedDay ? byDay.get(selectedDay) ?? [] : []
  const chip = (k: string) => k === 'deadline' ? 'bg-alert-100 text-alert-800' : k === 'hearing' ? 'bg-navy-900 text-white' : 'bg-gold-100 text-gold-800'

  return (
    <>
      <PageHeader title={t('nav.calendar')} description={t('la.cal.intro')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link href={qs({ m: addMonths(ym, -1), day: '' })} className={smallBtnCls} aria-label={t('list.prev')}><ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link>
              <h2 className="min-w-36 text-center text-base font-semibold text-slate-900">{monthLabel(ym, locale)}</h2>
              <Link href={qs({ m: addMonths(ym, 1), day: '' })} className={smallBtnCls} aria-label={t('list.next')}><ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link>
              {ym !== today.slice(0, 7) && <Link href={qs({ m: today.slice(0, 7), day: '' })} className={smallBtnCls}>{t('common.today')}</Link>}
            </div>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5" role="group" aria-label={t('la.cal.view')}>
              {(['agenda', 'month'] as const).map((v) => (
                <Link key={v} href={qs({ view: v })} aria-current={view === v ? 'true' : undefined}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === v ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {t(v === 'agenda' ? 'la.cal.agenda' : 'la.cal.month')}
                </Link>
              ))}
            </div>
          </div>

          <form method="get" action="/lawyer/calendar" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="m" value={ym} />
            <select name="kind" defaultValue={kind} aria-label={t('common.type')} className={`${inputCls} !w-auto`}>
              <option value="">{t('la.cal.allTypes')}</option>
              {EVENT_KINDS.map((k) => <option key={k} value={k}>{t(`eventKind.${k}`)}</option>)}
            </select>
            <select name="case" defaultValue={caseFilter} aria-label={t('common.case')} className={`${inputCls} !w-auto max-w-64`}>
              <option value="">{t('la.cal.allCases')}</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} · {c.title}</option>)}
            </select>
            <button type="submit" className={buttonCls}>{t('list.filter')}</button>
            {(kind || caseFilter) && <Link href={qs({ kind: '', case: '' })} className={smallBtnCls}>{t('list.clear')}</Link>}
          </form>

          {view === 'month' ? (
            <>
              <Card padded={false}>
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-medium text-slate-500">
                  {weekdays.map((w) => <div key={w} className="py-2">{w}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} className="min-h-16 border-b border-e border-slate-100 bg-slate-50/40 sm:min-h-24" />
                    const list = byDay.get(d) ?? []
                    const isSel = d === selectedDay
                    return (
                      <Link key={d} href={qs({ day: d })} aria-current={d === today ? 'date' : undefined}
                        className={`min-h-16 border-b border-e border-slate-100 p-1 hover:bg-gold-50 sm:min-h-24 sm:p-1.5 ${isSel ? 'bg-gold-50 ring-1 ring-inset ring-gold-500' : ''}`}>
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${d === today ? 'bg-gold-500 text-on-gold' : 'text-slate-700'}`}>{Number(d.slice(8))}</span>
                        <span className="mt-0.5 hidden space-y-0.5 sm:block">
                          {list.slice(0, 2).map((e) => <span key={e.id} className={`block truncate rounded px-1 text-[10px] leading-4 ${chip(e.kind)}`}>{e.title}</span>)}
                          {list.length > 2 && <span className="block text-[10px] text-slate-500">+{list.length - 2}</span>}
                        </span>
                        {list.length > 0 && <span className="mt-1 flex gap-0.5 sm:hidden">{list.slice(0, 3).map((e) => <span key={e.id} className="h-1.5 w-1.5 rounded-full bg-gold-600" />)}</span>}
                      </Link>
                    )
                  })}
                </div>
              </Card>
              {selectedDay && (
                <Card title={longDay(selectedDay, locale)} padded={false}>
                  <EventList events={dayEvents} caseTitles={caseTitles} cases={cases} canEdit emptyHint={t('la.cal.dayEmpty')} />
                </Card>
              )}
            </>
          ) : (
            <Card title={monthLabel(ym, locale)} padded={false}>
              <EventList events={events} caseTitles={caseTitles} cases={cases} canEdit emptyHint={t('la.event.noneCaseHint')} />
            </Card>
          )}
        </div>

        <Card title={t('la.event.add')} className="h-fit">
          <ActionForm action={addEvent} submitLabel={t('la.event.add')} pendingLabel={t('common.saving')}>
            <Field label={t('la.event.title')} name="title" required maxLength={200} placeholder={t('la.event.titlePlaceholder')} />
            <Select label={t('common.type')} name="kind" defaultValue="meeting" options={EVENT_KINDS.map((k) => ({ value: k, label: t(`eventKind.${k}`) }))} />
            <Field label={t('la.event.when')} name="starts_at" type="datetime-local" required defaultValue={selectedDay ? `${selectedDay}T10:00` : undefined} />
            <Field label={t('la.event.location')} name="location" maxLength={200} />
            <Select label={t('la.event.relatedCase')} name="case_id" emptyLabel={t('la.event.noCase')} options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
            <TextArea label={t('common.notes')} name="notes" rows={2} maxLength={1000} />
            <Checkbox name="visible_to_client" label={t('la.event.showClient')} />
          </ActionForm>
        </Card>
      </div>
    </>
  )
}
