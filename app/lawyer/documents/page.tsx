import { Upload } from 'lucide-react'
import Card from '@/components/Card'
import DocumentList from '@/components/DocumentList'
import DocumentUploader from '@/components/DocumentUploader'
import ListToolbar from '@/components/ListToolbar'
import LbFilterSelect from '@/components/LbFilterSelect'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { requireStaff } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { getI18n } from '@/lib/i18n'
import { first, ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { isUuid } from '@/lib/form'
import { loadCaseOptions } from '@/lib/lawyer-b-data'
import { createClient } from '@/lib/supabase/server'
import type { DocumentRow } from '@/lib/types'
import type { TKey } from '@/lib/i18n/shared'

const COLS = 'id, case_id, uploaded_by, name, storage_path, size_bytes, mime_type, visible_to_client, created_at, folder, group_id, version, is_current'

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t } = await getI18n()
  const paging = readPaging(sp)
  const folder = first(sp.folder).slice(0, 60)
  const caseId = isUuid(first(sp.case)) ? first(sp.case) : ''

  const sb = await createClient()
  let query = sb.from('documents').select(COLS, { count: 'exact' }).eq('is_current', true)
    .order('created_at', { ascending: false }).range(paging.from, paging.to)
  if (paging.q) query = query.or(ilikeOr(['name'], paging.q))
  if (folder) query = query.eq('folder', folder)
  if (caseId) query = query.eq('case_id', caseId)

  const [cases, folderRows, page] = await Promise.all([
    loadCaseOptions(sb),
    sb.from('documents').select('folder').eq('is_current', true).limit(2000),
    query,
  ])
  const current = (page.data ?? []) as DocumentRow[]
  const total = page.count ?? 0

  // older versions of the files on this page, for the "version history" panels
  const groupIds = [...new Set(current.map((d) => d.group_id))]
  const { data: versions } = groupIds.length
    ? await sb.from('documents').select(COLS).in('group_id', groupIds)
    : { data: [] as DocumentRow[] }
  const docs = (versions ?? []) as DocumentRow[]
  const names = await getNames(sb, docs.map((d) => d.uploaded_by))

  const caseTitles: Record<string, string> = {}
  const missing = [...new Set(current.map((d) => d.case_id))].filter((id) => !cases.some((c) => c.id === id))
  for (const c of cases) caseTitles[c.id] = `${c.case_number} · ${c.title}`
  if (missing.length) {
    const { data } = await sb.from('cases').select('id, case_number, title').in('id', missing)
    for (const c of data ?? []) caseTitles[c.id] = `${c.case_number} · ${c.title}`
  }

  const folders = [...new Set((folderRows.data ?? []).map((r) => r.folder as string))].sort()
  const folderLabel = (k: string) => {
    const key = `folder.${k}` as TKey
    const tr = t(key)
    return tr === key ? k : tr
  }

  // keep the page order (newest first) but show each file's whole history
  const order = new Map(current.map((d, i) => [d.group_id, i]))
  docs.sort((a, b) => (order.get(a.group_id) ?? 0) - (order.get(b.group_id) ?? 0))

  return (
    <>
      <PageHeader title={t('nav.documents')} description={t('lb.docs.subtitle')} />

      <Card title={t('doc.uploadTitle')} className="mb-6">
        {cases.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-600"><Upload className="h-4 w-4" aria-hidden />{t('lb.docs.noCases')}</p>
        ) : (
          <DocumentUploader cases={cases} canShare compact />
        )}
      </Card>

      <ListToolbar basePath="/lawyer/documents" q={paging.q} placeholder={t('lb.docs.search')} active={Boolean(folder || caseId)}>
        <LbFilterSelect name="folder" value={folder} label={t('doc.folder')}
          options={[{ value: '', label: t('lb.docs.allFolders') }, ...folders.map((f) => ({ value: f, label: folderLabel(f) }))]} />
        <LbFilterSelect name="case" value={caseId} label={t('common.case')}
          options={[{ value: '', label: t('lb.docs.allCases') }, ...cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))]} />
      </ListToolbar>

      <Card padded={false}>
        <DocumentList docs={docs} caseTitles={caseTitles} names={names} role="staff" meId={me.id} />
        <Pagination total={total} page={paging.page} size={paging.size} basePath="/lawyer/documents" params={{ q: paging.q, folder, case: caseId }} />
      </Card>
    </>
  )
}
