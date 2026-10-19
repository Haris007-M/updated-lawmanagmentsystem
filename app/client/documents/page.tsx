import Card from '@/components/Card'
import DocumentList from '@/components/DocumentList'
import DocumentUploader from '@/components/DocumentUploader'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { requireRole } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { DocumentRow } from '@/lib/types'

export default async function ClientDocumentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireRole('client')
  const { t } = await getI18n()
  const p = readPaging(await searchParams)
  const supabase = await createClient()

  let q = supabase.from('documents').select('*', { count: 'exact' }).eq('is_current', true)
  if (p.q) q = q.ilike('name', `%${p.q}%`)
  const [docsRes, casesRes] = await Promise.all([
    q.order('created_at', { ascending: false }).range(p.from, p.to),
    supabase.from('cases').select('id, title, case_number').eq('client_id', me.id).neq('status', 'closed').order('updated_at', { ascending: false }).limit(100),
  ])
  const docs = (docsRes.data ?? []) as DocumentRow[]
  const cases = (casesRes.data ?? []) as { id: string; title: string; case_number: string }[]
  // the list needs the older versions of the files on this page too
  const groupIds = [...new Set(docs.map((d) => d.group_id ?? d.id))]
  const { data: allVersions } = groupIds.length
    ? await supabase.from('documents').select('*').in('group_id', groupIds)
    : { data: [] as DocumentRow[] }
  const versions = (allVersions ?? docs) as DocumentRow[]
  const names = await getNames(supabase, versions.map((d) => d.uploaded_by))
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  if (docs.some((d) => !caseTitles[d.case_id])) {
    const { data: more } = await supabase.from('cases').select('id, title').in('id', [...new Set(docs.map((d) => d.case_id))])
    for (const c of more ?? []) caseTitles[c.id] = c.title
  }

  return (
    <>
      <PageHeader title={t('cl.docs.title')} description={t('cl.docs.desc')} />
      <div className="space-y-6">
        <Card title={t('cl.docs.upload')}>
          {cases.length === 0 ? (
            <p className="text-sm text-slate-500">{t('cl.docs.noCases')}</p>
          ) : (
            <DocumentUploader cases={cases} canShare={false} />
          )}
        </Card>
        <div>
          <ListToolbar basePath="/client/documents" q={p.q} placeholder={t('cl.docs.search')} />
          <Card title={t('cl.docs.list')} padded={false}>
            {docs.length === 0 && p.q ? (
              <EmptyState kind="search" title={t('list.noResults')} hint={t('list.noResultsHint')} />
            ) : (
              <DocumentList docs={versions} caseTitles={caseTitles} names={names} role="client" meId={me.id} />
            )}
            <Pagination total={docsRes.count ?? 0} page={p.page} size={p.size} basePath="/client/documents" params={{ q: p.q }} />
          </Card>
        </div>
      </div>
    </>
  )
}
