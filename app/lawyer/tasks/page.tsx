import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import TaskList from '@/components/TaskList'
import { Field, Select } from '@/components/Field'
import { inputCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { PRIORITIES } from '@/lib/constants'
import { getI18n } from '@/lib/i18n'
import { firmCaseOptions, firmStaff, personMap } from '@/lib/lawyer-a-data'
import { first, ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/tz'
import type { TaskRow } from '@/lib/types'
import { addTask } from '../practice-actions'

const VIEWS = ['mine', 'all', 'overdue'] as const
type View = (typeof VIEWS)[number]

export default async function TasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t } = await getI18n()
  const paging = readPaging(sp)
  const view: View = VIEWS.find((v) => v === first(sp.view)) ?? 'mine'
  const showDone = first(sp.done) === '1'
  const supabase = await createClient()

  let query = supabase.from('tasks').select('*', { count: 'exact' }).eq('lawyer_id', me.firm_id)
  if (view === 'mine') query = query.eq('assigned_to', me.id)
  if (view === 'overdue') query = query.lt('due_date', todayISO()).eq('done', false)
  else if (!showDone) query = query.eq('done', false)
  if (paging.q) query = query.or(ilikeOr(['title'], paging.q))
  const { data, count } = await query
    .order('done').order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
    .range(paging.from, paging.to)
  const tasks = (data ?? []) as TaskRow[]

  const [cases, staff] = await Promise.all([firmCaseOptions(supabase, me.firm_id), firmStaff(supabase, me.firm_id)])
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  const names = personMap(staff)
  const params = { q: paging.q, view, done: showDone ? '1' : undefined }

  return (
    <>
      <PageHeader title={t('nav.tasks')} description={t('la.tasks.intro')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListToolbar basePath="/lawyer/tasks" q={paging.q} placeholder={t('la.tasks.searchPlaceholder')} active={view !== 'mine' || showDone}>
            <select name="view" defaultValue={view} aria-label={t('la.tasks.view')} className={`${inputCls} !w-auto`}>
              <option value="mine">{t('la.tasks.mine')}</option>
              <option value="all">{t('la.tasks.all')}</option>
              <option value="overdue">{t('la.task.overdue')}</option>
            </select>
            <select name="done" defaultValue={showDone ? '1' : ''} aria-label={t('common.status')} className={`${inputCls} !w-auto`}>
              <option value="">{t('la.tasks.openOnly')}</option>
              <option value="1">{t('la.tasks.withDone')}</option>
            </select>
          </ListToolbar>
          <Card padded={false}>
            <TaskList tasks={tasks} caseTitles={caseTitles} cases={cases} staff={staff} names={names} />
            <Pagination total={count ?? 0} page={paging.page} size={paging.size} basePath="/lawyer/tasks" params={params} />
          </Card>
        </div>

        <Card title={t('la.task.add')} className="h-fit">
          <ActionForm action={addTask} submitLabel={t('la.task.add')} pendingLabel={t('common.saving')}>
            <Field label={t('la.task.title')} name="title" required maxLength={200} />
            <Field label={t('la.task.dueDate')} name="due_date" type="date" />
            <Select label={t('la.task.priority')} name="priority" defaultValue="medium" options={PRIORITIES.map((p) => ({ value: p, label: t(`priority.${p}`) }))} />
            <Select label={t('la.event.relatedCase')} name="case_id" emptyLabel={t('common.none')} options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
            <Select label={t('la.task.assignee')} name="assigned_to" defaultValue={me.id} emptyLabel={t('la.task.unassigned')} options={staff.map((s) => ({ value: s.id, label: s.id === me.id ? `${s.name} (${t('common.you')})` : s.name }))} />
          </ActionForm>
        </Card>
      </div>
    </>
  )
}
