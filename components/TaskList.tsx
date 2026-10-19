import { Check } from 'lucide-react'
import { deleteTask, toggleTask, updateTask } from '@/app/lawyer/practice-actions'
import { PRIORITIES } from '@/lib/constants'
import { nameOf, type NameMap } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { todayISO } from '@/lib/tz'
import type { TaskRow } from '@/lib/types'
import ActionForm from './ActionForm'
import { PriorityBadge } from './Badge'
import ConfirmButton from './ConfirmButton'
import EmptyState from './EmptyState'
import { Field, Select } from './Field'
import { dangerLinkCls } from './ui'

type CaseOption = { id: string; title: string; case_number: string }

export default async function TaskList({
  tasks, caseTitles = {}, showCase = true, cases, staff, names = {},
}: {
  tasks: TaskRow[]; caseTitles?: Record<string, string>; showCase?: boolean; cases?: CaseOption[]
  staff?: { id: string; name: string }[]  // people a task can be assigned to
  names?: NameMap
}) {
  const { t, f } = await getI18n()
  if (tasks.length === 0) return <EmptyState kind="tasks" title={t('la.task.none')} hint={t('la.task.noneHint')} />
  const today = todayISO()

  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => {
        const overdue = !task.done && task.due_date !== null && task.due_date < today
        return (
          <li key={task.id} className="px-5 py-3">
            <div className="flex items-center gap-3">
              <form action={toggleTask}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="done" value={String(!task.done)} />
                <button
                  type="submit"
                  aria-label={task.done ? t('la.task.markUndone') : t('la.task.markDone')}
                  className={`flex h-6 w-6 items-center justify-center rounded border max-sm:h-8 max-sm:w-8 ${
                    task.done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-surface hover:border-gold-600'
                  }`}
                >
                  {task.done && <Check className="h-4 w-4" aria-hidden />}
                </button>
              </form>
              <div className="min-w-0 flex-1">
                <p className={`break-words text-sm ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                <p className={`text-xs ${overdue ? 'font-medium text-alert-700' : 'text-slate-500'}`}>
                  {task.due_date ? `${overdue ? `${t('la.task.overdue')} · ` : `${t('la.task.due')} `}${f.date(task.due_date)}` : t('common.noDate')}
                  {showCase && task.case_id && caseTitles[task.case_id] ? ` · ${caseTitles[task.case_id]}` : ''}
                  {task.assigned_to ? ` · ${nameOf(names, task.assigned_to, t('common.unknown'))}` : ''}
                </p>
              </div>
              <PriorityBadge priority={task.priority} />
              <form action={deleteTask}>
                <input type="hidden" name="id" value={task.id} />
                <ConfirmButton message={t('la.task.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
              </form>
            </div>

            <details className="mt-1 ps-9">
              <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">{t('common.edit')}</summary>
              <div className="mt-3 rounded-xl bg-slate-50 p-4">
                <ActionForm action={updateTask} submitLabel={t('la.task.save')} resetOnSuccess={false}>
                  <input type="hidden" name="id" value={task.id} />
                  {!cases && <input type="hidden" name="case_id" value={task.case_id ?? ''} />}
                  {!staff && <input type="hidden" name="assigned_to" value={task.assigned_to ?? ''} />}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2"><Field id={`t-title-${task.id}`} label={t('la.task.title')} name="title" required defaultValue={task.title} /></div>
                    <Field id={`t-due-${task.id}`} label={t('la.task.dueDate')} name="due_date" type="date" defaultValue={task.due_date} />
                    <Select id={`t-prio-${task.id}`} label={t('la.task.priority')} name="priority" defaultValue={task.priority}
                      options={PRIORITIES.map((p) => ({ value: p, label: t(`priority.${p}`) }))} />
                    {staff && (
                      <Select id={`t-as-${task.id}`} label={t('la.task.assignee')} name="assigned_to" emptyLabel={t('la.task.unassigned')} defaultValue={task.assigned_to ?? ''}
                        options={staff.map((s) => ({ value: s.id, label: s.name }))} />
                    )}
                    {cases && (
                      <Select id={`t-case-${task.id}`} label={t('la.event.relatedCase')} name="case_id" emptyLabel={t('common.none')} defaultValue={task.case_id ?? ''}
                        options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
                    )}
                  </div>
                </ActionForm>
              </div>
            </details>
          </li>
        )
      })}
    </ul>
  )
}
