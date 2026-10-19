import Link from 'next/link'
import { deleteCase, addCaseTime, addEvent, addNote, addTask, deleteCaseTime, deleteNote, updateCase } from '../../practice-actions'
import ActionForm from '@/components/ActionForm'
import { Badge, InvoiceStatusBadge } from '@/components/Badge'
import Card from '@/components/Card'
import CaseMessages from '@/components/CaseMessages'
import ConfirmButton from '@/components/ConfirmButton'
import DocumentList from '@/components/DocumentList'
import DocumentUploader from '@/components/DocumentUploader'
import EmptyState from '@/components/EmptyState'
import EventList from '@/components/EventList'
import { Checkbox, Field, Select, TextArea } from '@/components/Field'
import TaskList from '@/components/TaskList'
import { Table, TBody, Td, THead, Th, Tr } from '@/components/Table'
import WhatsAppButton from '@/components/WhatsAppButton'
import { dangerBtnCls, dangerLinkCls, linkCls } from '@/components/ui'
import { CASE_STATUSES, CASE_TYPES, EVENT_KINDS, PRIORITIES } from '@/lib/constants'
import { getNames, nameOf } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { caseTypeLabel } from '@/lib/lawyer-a-format'
import { firmStaff, nextHearingByCase, personMap } from '@/lib/lawyer-a-data'
import { formatTotals, sumByCurrency } from '@/lib/format'
import { todayISO } from '@/lib/tz'
import { createClient } from '@/lib/supabase/server'
import type {
  CaseRow, Context, DocumentRow, EventRow, InvoiceRow, MessageRow, NoteRow, TaskRow, TimeEntryRow,
} from '@/lib/types'

interface TabProps { c: CaseRow; me: Context & { firm_id: string }; clientName: string }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-slate-900">{children || '—'}</dd></div>
}

// ---------------------------------------------------------------- overview
export async function OverviewTab({ c, me, clientName }: TabProps) {
  const { t, f } = await getI18n()
  const supabase = await createClient()
  const owner = me.role === 'lawyer'
  const [hearings, { data: client }] = await Promise.all([
    nextHearingByCase(supabase, me.firm_id, [c.id]),
    supabase.from('profiles').select('phone').eq('id', c.client_id).maybeSingle(),
  ])
  const next = hearings[c.id]
  const message = next
    ? t('la.wa.hearing', { name: clientName, case: c.case_number, title: c.title, date: f.dayLong(next), time: f.time(next), court: c.court ? ` (${c.court})` : '', firm: me.firm_name ?? '' })
    : t('la.wa.hello', { name: clientName, firm: me.firm_name ?? '' })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title={t('la.tab.details')}>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Row label={t('common.client')}><Link href={`/lawyer/clients/${c.client_id}`} className={linkCls}>{clientName}</Link></Row>
          <Row label={t('common.type')}>{caseTypeLabel(t, c.case_type)}</Row>
          <Row label={t('la.case.court')}>{c.court}</Row>
          <Row label={t('la.case.courtNumber')}><span dir="ltr">{c.court_case_number}</span></Row>
          <Row label={t('la.case.judge')}>{c.judge}</Row>
          <Row label={t('la.case.stage')}>{c.stage}</Row>
          <Row label={t('la.case.opposing')}>{c.opposing_party}</Row>
          <Row label={t('la.case.opened')}>{f.date(c.opened_on)}</Row>
          {c.closed_on && <Row label={t('la.case.closed')}>{f.date(c.closed_on)}</Row>}
        </dl>
        {c.description && <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm text-slate-700">{c.description}</p>}
      </Card>

      <div className="space-y-6">
        <Card title={t('la.cases.nextHearing')}>
          {next ? (
            <>
              <p className="font-display text-xl font-semibold text-brand-900">{f.dayLong(next)}</p>
              <p className="text-sm text-slate-600">{f.time(next)}{c.court ? ` · ${c.court}` : ''}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t('la.cases.noNextHearing')}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={`/lawyer/cases/${c.id}?tab=schedule`} className={linkCls}>{t('la.hearing.manage')}</Link>
            {client?.phone && <WhatsAppButton phone={client.phone} message={message} whatsappLabel={next ? t('la.wa.remindHearing') : t('la.wa.whatsapp')} smsLabel={t('la.wa.sms')} />}
          </div>
        </Card>

        <Card title={t('la.case.editTitle')}>
          <ActionForm action={updateCase} submitLabel={t('common.saveChanges')} resetOnSuccess={false}>
            <input type="hidden" name="id" value={c.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label={t('la.cases.title')} name="title" required defaultValue={c.title} /></div>
              <Select label={t('common.type')} name="case_type" defaultValue={c.case_type} options={CASE_TYPES.map((x) => ({ value: x, label: t(`caseType.${x}`) }))} />
              <Select label={t('common.status')} name="status" defaultValue={c.status} options={CASE_STATUSES.map((x) => ({ value: x, label: t(`caseStatus.${x}`) }))} />
              <Field label={t('la.case.court')} name="court" defaultValue={c.court} />
              <Field label={t('la.case.courtNumber')} name="court_case_number" dir="ltr" defaultValue={c.court_case_number} />
              <Field label={t('la.case.judge')} name="judge" defaultValue={c.judge} />
              <Field label={t('la.case.stage')} name="stage" defaultValue={c.stage} />
              <div className="sm:col-span-2"><Field label={t('la.case.opposing')} name="opposing_party" defaultValue={c.opposing_party} /></div>
            </div>
            <TextArea label={t('la.case.summary')} name="description" rows={4} defaultValue={c.description} hint={t('la.case.summaryHint')} />
          </ActionForm>
        </Card>

        {owner && (
          <Card title={t('la.case.deleteTitle')}>
            <p className="mb-3 text-sm text-slate-600">{t('la.case.deleteWarn')}</p>
            <ActionForm action={deleteCase} submitLabel={t('la.case.deleteBtn')} pendingLabel={t('common.saving')} buttonClassName={dangerBtnCls} resetOnSuccess={false}>
              <input type="hidden" name="id" value={c.id} />
              <Field label={t('la.case.deleteType', { number: c.case_number })} name="confirm" dir="ltr" required autoComplete="off" />
            </ActionForm>
          </Card>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- messages
export async function MessagesTab({ c, me }: TabProps) {
  const { t } = await getI18n()
  const supabase = await createClient()
  const { data } = await supabase.from('case_messages').select('*').eq('case_id', c.id).order('created_at', { ascending: true }).limit(300)
  const messages = (data ?? []) as MessageRow[]
  const names = await getNames(supabase, [...messages.map((m) => m.author_id), c.client_id])
  return (
    <Card title={t('la.tab.messages')}>
      <CaseMessages caseId={c.id} meId={me.id} messages={messages} names={names} />
    </Card>
  )
}

// ---------------------------------------------------------------- documents
export async function DocumentsTab({ c, me }: TabProps) {
  const { t } = await getI18n()
  const supabase = await createClient()
  const { data } = await supabase.from('documents').select('*').eq('case_id', c.id).order('created_at', { ascending: false }).limit(500)
  const docs = (data ?? []) as DocumentRow[]
  const names = await getNames(supabase, docs.map((d) => d.uploaded_by))
  return (
    <div className="grid gap-6">
      <Card title={t('doc.uploadTitle')}>
        <DocumentUploader caseId={c.id} canShare compact />
      </Card>
      <Card padded={false}>
        <DocumentList docs={docs} names={names} role="staff" meId={me.id} showCase={false} caseId={c.id} />
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- tasks
export async function TasksTab({ c, me }: TabProps) {
  const { t } = await getI18n()
  const supabase = await createClient()
  const [{ data }, staff] = await Promise.all([
    supabase.from('tasks').select('*').eq('case_id', c.id).order('done').order('due_date', { ascending: true, nullsFirst: false }).limit(200),
    firmStaff(supabase, me.firm_id),
  ])
  const tasks = (data ?? []) as TaskRow[]
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card padded={false}>
          <TaskList tasks={tasks} showCase={false} staff={staff} names={personMap(staff)} />
        </Card>
      </div>
      <Card title={t('la.task.add')}>
        <ActionForm action={addTask} submitLabel={t('la.task.add')} pendingLabel={t('common.saving')}>
          <input type="hidden" name="case_id" value={c.id} />
          <Field label={t('la.task.title')} name="title" required />
          <Field label={t('la.task.dueDate')} name="due_date" type="date" dir="ltr" />
          <Select label={t('la.task.priority')} name="priority" defaultValue="medium" options={PRIORITIES.map((p) => ({ value: p, label: t(`priority.${p}`) }))} />
          <Select label={t('la.task.assignee')} name="assigned_to" emptyLabel={t('la.task.unassigned')} options={staff.map((s) => ({ value: s.id, label: s.name }))} />
        </ActionForm>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- schedule (hearings)
export async function ScheduleTab({ c, me }: TabProps) {
  const { t } = await getI18n()
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('*').eq('case_id', c.id).eq('lawyer_id', me.firm_id).order('starts_at', { ascending: false }).limit(200)
  const events = (data ?? []) as EventRow[]
  const nowIso = new Date().toISOString()
  const upcoming = events.filter((e) => e.starts_at >= nowIso).reverse()
  const past = events.filter((e) => e.starts_at < nowIso)
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title={t('la.event.upcoming')} padded={false}>
          <EventList events={upcoming} canEdit emptyHint={t('la.event.noneCaseHint')} />
        </Card>
        {past.length > 0 && (
          <Card title={t('la.event.past')} padded={false}>
            <EventList events={past} canEdit />
          </Card>
        )}
      </div>
      <Card title={t('la.event.add')}>
        <ActionForm action={addEvent} submitLabel={t('la.event.add')} pendingLabel={t('common.saving')}>
          <input type="hidden" name="case_id" value={c.id} />
          <Field label={t('la.event.title')} name="title" required placeholder={t('la.event.titlePlaceholder')} />
          <Select label={t('common.type')} name="kind" defaultValue="hearing" options={EVENT_KINDS.map((k) => ({ value: k, label: t(`eventKind.${k}`) }))} />
          <Field label={t('la.event.when')} name="starts_at" type="datetime-local" dir="ltr" required />
          <Field label={t('la.event.location')} name="location" defaultValue={c.court} />
          <TextArea label={t('common.notes')} name="notes" rows={2} maxLength={1000} />
          <Checkbox name="visible_to_client" label={t('la.event.showClientShort')} />
        </ActionForm>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- private notes
export async function NotesTab({ c, me }: TabProps) {
  const { t, f } = await getI18n()
  const supabase = await createClient()
  const { data } = await supabase.from('case_notes').select('*').eq('case_id', c.id).order('created_at', { ascending: false }).limit(200)
  const notes = (data ?? []) as NoteRow[]
  const names = await getNames(supabase, notes.map((n) => n.author_id))
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card padded={false}>
          {notes.length === 0 ? (
            <EmptyState kind="generic" compact title={t('la.notes.none')} hint={t('la.notes.hint')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {notes.map((n) => (
                <li key={n.id} className="px-5 py-4">
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{n.body}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{nameOf(names, n.author_id, t('common.unknown'))} · {f.dateTime(n.created_at)}</span>
                    {(n.author_id === me.id || me.role === 'lawyer') && (
                      <form action={deleteNote}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="case_id" value={c.id} />
                        <ConfirmButton message={t('la.notes.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card title={t('la.notes.add')}>
        <p className="mb-3 text-xs text-slate-500">{t('la.notes.privateNote')}</p>
        <ActionForm action={addNote} submitLabel={t('la.notes.save')} pendingLabel={t('common.saving')}>
          <input type="hidden" name="case_id" value={c.id} />
          <TextArea name="body" rows={5} required ariaLabel={t('la.notes.add')} />
        </ActionForm>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- time
export async function TimeTab({ c, me }: TabProps) {
  const { t, f } = await getI18n()
  const supabase = await createClient()
  const { data } = await supabase.from('time_entries').select('*').eq('case_id', c.id).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(200)
  const entries = (data ?? []) as TimeEntryRow[]
  const names = await getNames(supabase, entries.map((e) => e.user_id))
  const totalMin = entries.reduce((a, e) => a + e.minutes, 0)
  const billableMin = entries.filter((e) => e.billable).reduce((a, e) => a + e.minutes, 0)
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge tone="indigo">{t('la.time.total')}: {f.duration(totalMin)}</Badge>
          <Badge tone="green">{t('la.time.billable')}: {f.duration(billableMin)}</Badge>
          {me.role === 'junior' && <span className="text-xs text-slate-500">{t('la.time.juniorNote')}</span>}
        </div>
        <Card padded={false}>
          {entries.length === 0 ? (
            <EmptyState kind="time" title={t('la.time.none')} hint={t('la.time.noneHint')} />
          ) : (
            <Table>
              <THead><Th>{t('common.date')}</Th><Th>{t('common.description')}</Th><Th>{t('la.time.by')}</Th><Th>{t('la.time.duration')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th></THead>
              <TBody>
                {entries.map((e) => (
                  <Tr key={e.id}>
                    <Td label={t('common.date')}>{f.date(e.entry_date)}</Td>
                    <Td label={t('common.description')}>
                      {e.description}
                      <span className="ms-2 inline-flex">{e.invoiced_invoice_id ? <Badge tone="green">{t('la.time.invoiced')}</Badge> : e.billable ? null : <Badge>{t('la.time.nonBillable')}</Badge>}</span>
                    </Td>
                    <Td label={t('la.time.by')}>{nameOf(names, e.user_id, t('common.unknown'))}</Td>
                    <Td label={t('la.time.duration')}>{f.duration(e.minutes)}</Td>
                    <Td label="">
                      {!e.invoiced_invoice_id && (
                        <form action={deleteCaseTime}>
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="case_id" value={c.id} />
                          <ConfirmButton message={t('la.time.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
                        </form>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
      <Card title={t('la.time.add')}>
        <ActionForm action={addCaseTime} submitLabel={t('la.time.add')} pendingLabel={t('common.saving')}>
          <input type="hidden" name="case_id" value={c.id} />
          <Field label={t('la.time.workDone')} name="description" required maxLength={500} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('la.time.hours')} name="hours" type="number" dir="ltr" min={0} max={24} defaultValue={0} />
            <Field label={t('la.time.minutes')} name="minutes" type="number" dir="ltr" min={0} max={59} defaultValue={30} />
          </div>
          <Field label={t('common.date')} name="entry_date" type="date" dir="ltr" defaultValue={todayISO()} />
          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input type="checkbox" name="billable" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-[var(--color-gold-600)]" />
            {t('la.time.billableLabel')}
          </label>
        </ActionForm>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- billing (owner only)
export async function BillingTab({ c, me }: TabProps) {
  const { t, f } = await getI18n()
  const supabase = await createClient()
  const [{ data }, { data: unbilled }] = await Promise.all([
    supabase.from('invoices').select('id, number, status, amount_cents, currency, issued_on, due_on').eq('lawyer_id', me.firm_id).eq('case_id', c.id).order('created_at', { ascending: false }).limit(100),
    supabase.from('time_entries').select('minutes').eq('case_id', c.id).eq('billable', true).is('invoiced_invoice_id', null),
  ])
  const invoices = (data ?? []) as Pick<InvoiceRow, 'id' | 'number' | 'status' | 'amount_cents' | 'currency' | 'issued_on' | 'due_on'>[]
  const unbilledMin = (unbilled ?? []).reduce((a, e) => a + e.minutes, 0)
  const paid = invoices.filter((i) => i.status === 'paid')
  const open = invoices.filter((i) => i.status === 'sent')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge tone="green">{t('la.billing.paid')}: {formatTotals(sumByCurrency(paid), f.money)}</Badge>
        <Badge tone="amber">{t('la.billing.outstanding')}: {formatTotals(sumByCurrency(open), f.money)}</Badge>
        <Badge>{t('la.billing.unbilledTime')}: {f.duration(unbilledMin)}</Badge>
        <Link href={`/lawyer/billing?case=${c.id}`} className={linkCls}>{t('la.billing.manage')}</Link>
      </div>
      <Card padded={false}>
        {invoices.length === 0 ? (
          <EmptyState kind="invoices" title={t('la.billing.none')} />
        ) : (
          <Table>
            <THead><Th>{t('la.billing.number')}</Th><Th>{t('common.status')}</Th><Th>{t('common.amount')}</Th><Th>{t('la.billing.issued')}</Th><Th>{t('la.billing.due')}</Th></THead>
            <TBody>
              {invoices.map((i) => (
                <Tr key={i.id}>
                  <Td label={t('la.billing.number')}><Link href={`/lawyer/billing/${i.id}`} className={linkCls}>{i.number}</Link></Td>
                  <Td label={t('common.status')}><InvoiceStatusBadge status={i.status} /></Td>
                  <Td label={t('common.amount')}>{f.money(i.amount_cents, i.currency)}</Td>
                  <Td label={t('la.billing.issued')}>{f.date(i.issued_on)}</Td>
                  <Td label={t('la.billing.due')}>{f.date(i.due_on)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
