import { deleteEvent, recordOutcome, updateEvent } from '@/app/lawyer/practice-actions'
import { EVENT_KINDS } from '@/lib/constants'
import { getI18n } from '@/lib/i18n'
import { dayTile } from '@/lib/lawyer-a-format'
import { utcToLocalInput } from '@/lib/tz'
import type { EventRow } from '@/lib/types'
import ActionForm from './ActionForm'
import { Badge } from './Badge'
import ConfirmButton from './ConfirmButton'
import EmptyState from './EmptyState'
import { Checkbox, Field, Select, TextArea } from './Field'
import { dangerLinkCls } from './ui'

type CaseOption = { id: string; title: string; case_number: string }

// Events as a list. canEdit = firm staff (edit, delete, record the outcome of a hearing); read-only for clients.
const currentTime = () => Date.now()

export default async function EventList({
  events, caseTitles = {}, canEdit = false, emptyHint, cases,
}: {
  events: EventRow[]; caseTitles?: Record<string, string>; canEdit?: boolean
  emptyHint?: string; cases?: CaseOption[]
}) {
  const { t, f, locale } = await getI18n()
  if (events.length === 0) return <EmptyState kind="calendar" title={t('la.event.none')} hint={emptyHint} />
  const now = currentTime()

  return (
    <ul className="divide-y divide-slate-100">
      {events.map((e) => {
        const tile = dayTile(e.starts_at, locale)
        const past = new Date(e.starts_at).getTime() < now
        return (
          <li key={e.id} className="px-5 py-3.5">
            <div className="flex items-start gap-4">
              <div className="w-16 shrink-0 rounded-xl bg-brand-50 py-1.5 text-center" aria-hidden>
                <p className="text-xs font-medium text-brand-600">{tile.mon}</p>
                <p className="text-lg font-semibold leading-tight text-brand-900">{tile.day}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{e.title}</p>
                <p className="text-xs text-slate-500">
                  {f.date(e.starts_at)} · {f.time(e.starts_at)}
                  {e.location ? ` · ${e.location}` : ''}
                  {e.case_id && caseTitles[e.case_id] ? ` · ${caseTitles[e.case_id]}` : ''}
                </p>
                {e.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{e.notes}</p>}
                {e.outcome && (
                  <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                    <span className="font-semibold">{t('la.hearing.outcome')}: </span>{e.outcome}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Badge tone={e.kind === 'deadline' ? 'red' : e.kind === 'hearing' ? 'indigo' : 'blue'}>
                    {t(`eventKind.${e.kind}`)}
                  </Badge>
                  {canEdit && (e.visible_to_client ? <Badge tone="green">{t('la.event.visibleToClient')}</Badge> : <Badge>{t('common.private')}</Badge>)}
                  {canEdit && e.kind === 'hearing' && past && !e.outcome && <Badge tone="amber">{t('la.hearing.needsOutcome')}</Badge>}
                </div>
              </div>
              {canEdit && (
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmButton message={t('la.event.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
                </form>
              )}
            </div>

            {canEdit && e.kind === 'hearing' && (
              <details className="mt-1 sm:ps-20">
                <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">{t('la.hearing.record')}</summary>
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <ActionForm action={recordOutcome} submitLabel={t('common.save')} resetOnSuccess={false}>
                    <input type="hidden" name="id" value={e.id} />
                    <TextArea id={`o-${e.id}`} label={t('la.hearing.whatHappened')} name="outcome" rows={2} maxLength={1000} defaultValue={e.outcome} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id={`on-${e.id}`} label={t('la.hearing.nextDate')} name="next_at" type="datetime-local" hint={t('la.hearing.nextHint')} />
                      <Field id={`ol-${e.id}`} label={t('la.event.location')} name="next_location" defaultValue={e.location} />
                      <Field id={`os-${e.id}`} label={t('la.case.stage')} name="stage" maxLength={100} hint={t('la.hearing.stageHint')} />
                    </div>
                  </ActionForm>
                </div>
              </details>
            )}

            {canEdit && (
              <details className="mt-1 sm:ps-20">
                <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">{t('common.edit')}</summary>
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <ActionForm action={updateEvent} submitLabel={t('la.event.save')} resetOnSuccess={false}>
                    <input type="hidden" name="id" value={e.id} />
                    {!cases && <input type="hidden" name="case_id" value={e.case_id ?? ''} />}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id={`e-title-${e.id}`} label={t('la.event.title')} name="title" required defaultValue={e.title} />
                      <Select id={`e-kind-${e.id}`} label={t('common.type')} name="kind" defaultValue={e.kind}
                        options={EVENT_KINDS.map((k) => ({ value: k, label: t(`eventKind.${k}`) }))} />
                      <Field id={`e-start-${e.id}`} label={t('la.event.when')} name="starts_at" type="datetime-local" required defaultValue={utcToLocalInput(e.starts_at)} />
                      <Field id={`e-loc-${e.id}`} label={t('la.event.location')} name="location" defaultValue={e.location} />
                      {cases && (
                        <div className="sm:col-span-2">
                          <Select id={`e-case-${e.id}`} label={t('la.event.relatedCase')} name="case_id" emptyLabel={t('la.event.noCase')} defaultValue={e.case_id ?? ''}
                            options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
                        </div>
                      )}
                      <div className="sm:col-span-2"><TextArea id={`e-notes-${e.id}`} label={t('common.notes')} name="notes" rows={2} maxLength={1000} defaultValue={e.notes} /></div>
                    </div>
                    <Checkbox name="visible_to_client" label={t('la.event.showClient')} defaultChecked={e.visible_to_client} />
                  </ActionForm>
                </div>
              </details>
            )}
          </li>
        )
      })}
    </ul>
  )
}
