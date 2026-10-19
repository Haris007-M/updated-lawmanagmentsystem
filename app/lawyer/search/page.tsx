import Link from 'next/link'
import { FileText, FolderOpen, ListChecks, Users } from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import { CaseStatusBadge } from '@/components/Badge'
import { linkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow } from '@/lib/types'

const LIMIT = 10

function Group({ icon, title, n, children }: { icon: React.ReactNode; title: string; n: number; children: React.ReactNode }) {
  if (n === 0) return null
  return (
    <Card title={title} padded={false} action={<span className="text-xs text-slate-500">{icon}</span>}>
      <ul className="divide-y divide-slate-100">{children}</ul>
    </Card>
  )
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t, f } = await getI18n()
  const { q } = readPaging(sp)
  const supabase = await createClient()
  const ready = q.length >= 2

  const [casesRes, clientsRes, docsRes, tasksRes] = ready
    ? await Promise.all([
        supabase.from('cases').select('id, case_number, title, status, court_case_number, opposing_party')
          .eq('lawyer_id', me.firm_id).or(ilikeOr(['title', 'case_number', 'court_case_number', 'opposing_party'], q))
          .order('updated_at', { ascending: false }).limit(LIMIT),
        supabase.from('profiles').select('id, full_name, email, phone')
          .eq('role', 'client').eq('lawyer_id', me.firm_id).or(ilikeOr(['full_name', 'email', 'phone'], q)).limit(LIMIT),
        supabase.from('documents').select('id, case_id, name, folder, created_at')
          .eq('is_current', true).ilike('name', `%${q}%`).order('created_at', { ascending: false }).limit(LIMIT),
        supabase.from('tasks').select('id, case_id, title, due_date, done')
          .eq('lawyer_id', me.firm_id).ilike('title', `%${q}%`).order('created_at', { ascending: false }).limit(LIMIT),
      ])
    : [null, null, null, null]

  const cases = (casesRes?.data ?? []) as Pick<CaseRow, 'id' | 'case_number' | 'title' | 'status' | 'court_case_number' | 'opposing_party'>[]
  const clients = (clientsRes?.data ?? []) as { id: string; full_name: string | null; email: string; phone: string | null }[]
  const docs = (docsRes?.data ?? []) as { id: string; case_id: string; name: string; folder: string | null; created_at: string }[]
  const tasks = (tasksRes?.data ?? []) as { id: string; case_id: string | null; title: string; due_date: string | null; done: boolean }[]
  const none = ready && cases.length + clients.length + docs.length + tasks.length === 0

  return (
    <>
      <PageHeader title={t('nav.search')} description={t('la.search.intro')} />
      <ListToolbar basePath="/lawyer/search" q={q} placeholder={t('la.search.placeholder')} />
      {!ready ? (
        <Card><EmptyState kind="search" title={t('la.search.start')} hint={t('la.search.startHint')} /></Card>
      ) : none ? (
        <Card><EmptyState kind="search" title={t('list.noResults')} hint={t('list.noResultsHint')} /></Card>
      ) : (
        <div className="space-y-5">
          <Group icon={<FolderOpen className="h-4 w-4" aria-hidden />} title={t('nav.cases')} n={cases.length}>
            {cases.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/lawyer/cases/${c.id}`} className={`${linkCls} block truncate`}>{c.title}</Link>
                  <p className="truncate text-xs text-slate-500">{c.case_number}{c.court_case_number ? ` · ${c.court_case_number}` : ''}{c.opposing_party ? ` · ${c.opposing_party}` : ''}</p>
                </div>
                <CaseStatusBadge status={c.status} />
              </li>
            ))}
          </Group>
          <Group icon={<Users className="h-4 w-4" aria-hidden />} title={t('nav.clients')} n={clients.length}>
            {clients.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <Link href={`/lawyer/clients/${c.id}`} className={linkCls}>{c.full_name || c.email}</Link>
                <p className="text-xs text-slate-500" dir="ltr">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
              </li>
            ))}
          </Group>
          <Group icon={<FileText className="h-4 w-4" aria-hidden />} title={t('nav.documents')} n={docs.length}>
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link href={`/lawyer/cases/${d.case_id}?tab=documents`} className={`${linkCls} truncate`}>{d.name}</Link>
                <span className="shrink-0 text-xs text-slate-500">{d.folder ? `${d.folder} · ` : ''}{f.date(d.created_at)}</span>
              </li>
            ))}
          </Group>
          <Group icon={<ListChecks className="h-4 w-4" aria-hidden />} title={t('nav.tasks')} n={tasks.length}>
            {tasks.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link href={k.case_id ? `/lawyer/cases/${k.case_id}?tab=tasks` : '/lawyer/tasks?view=all&done=1'} className={`${linkCls} truncate ${k.done ? 'line-through' : ''}`}>{k.title}</Link>
                <span className="shrink-0 text-xs text-slate-500">{k.due_date ? f.date(k.due_date) : t('common.noDate')}</span>
              </li>
            ))}
          </Group>
        </div>
      )}
    </>
  )
}
