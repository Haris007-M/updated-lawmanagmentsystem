import { Download, FileText, FolderOpen } from 'lucide-react'
import { deleteDocument, moveDocument, setDocumentShared } from '@/app/actions/documents'
import { formatBytes } from '@/lib/format'
import { getI18n } from '@/lib/i18n'
import { nameOf, type NameMap } from '@/lib/data'
import type { DocumentRow } from '@/lib/types'
import type { TKey } from '@/lib/i18n/shared'
import { Badge } from './Badge'
import ConfirmButton from './ConfirmButton'
import DocumentUploader from './DocumentUploader'
import EmptyState from './EmptyState'
import { dangerLinkCls, inputCls, linkCls, smallBtnCls } from './ui'

// Documents grouped by folder. Each file shows its newest version; older versions sit under "Version history".
export default async function DocumentList({
  docs, caseTitles = {}, names, role, meId, showCase = true, caseId,
}: {
  docs: DocumentRow[]          // ALL versions (the list works out which is current)
  caseTitles?: Record<string, string>
  names: NameMap
  role: 'staff' | 'client'
  meId: string
  showCase?: boolean
  caseId?: string              // when set, "upload new version" is available inside this case
}) {
  const { t, f } = await getI18n()
  const staff = role === 'staff'

  if (docs.length === 0) {
    return <EmptyState kind="documents" title={t('doc.none')} hint={staff ? t('doc.noneStaff') : t('doc.noneClient')} />
  }

  // group versions of the same file
  const groups = new Map<string, DocumentRow[]>()
  for (const d of docs) {
    const g = groups.get(d.group_id ?? d.id) ?? []
    g.push(d)
    groups.set(d.group_id ?? d.id, g)
  }
  const files = [...groups.values()].map((vs) => {
    vs.sort((a, b) => b.version - a.version)
    return { current: vs.find((v) => v.is_current) ?? vs[0], history: vs }
  })

  const folders = new Map<string, typeof files>()
  for (const x of files) {
    const k = x.current.folder || 'General'
    folders.set(k, [...(folders.get(k) ?? []), x])
  }
  const folderName = (k: string) => {
    const key = `folder.${k}` as TKey
    const tr = t(key)
    return tr === key ? k : tr
  }

  return (
    <div className="divide-y divide-slate-100">
      {[...folders.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([folder, items]) => (
        <section key={folder} aria-label={folderName(folder)}>
          <h3 className="flex items-center gap-2 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-600">
            <FolderOpen className="h-4 w-4 text-gold-600" aria-hidden /> {folderName(folder)}
            <span className="rounded-full bg-slate-200/70 px-1.5 text-[11px]">{items.length}</span>
          </h3>
          <ul className="divide-y divide-slate-100">
            {items.map(({ current: d, history }) => (
              <li key={d.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                    <div className="min-w-0">
                      <a href={`/api/documents/${d.id}`} className={`${linkCls} break-words`} download>
                        {d.name}
                      </a>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatBytes(d.size_bytes)} · {f.date(d.created_at)} · {nameOf(names, d.uploaded_by, t('common.unknown'))}
                        {showCase && caseTitles[d.case_id] ? ` · ${caseTitles[d.case_id]}` : ''}
                        {history.length > 1 ? ` · ${t('doc.versionN', { n: d.version })}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {staff && (d.visible_to_client ? <Badge tone="green">{t('common.sharedShort')}</Badge> : <Badge>{t('common.private')}</Badge>)}
                    <a href={`/api/documents/${d.id}`} className={smallBtnCls} download>
                      <Download className="h-3.5 w-3.5" aria-hidden /> {t('common.download')}
                    </a>
                    {staff && (
                      <form action={setDocumentShared}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="visible" value={String(!d.visible_to_client)} />
                        <button type="submit" className={linkCls}>{d.visible_to_client ? t('doc.unshare') : t('doc.share')}</button>
                      </form>
                    )}
                    {(staff || d.uploaded_by === meId) && (
                      <form action={deleteDocument}>
                        <input type="hidden" name="id" value={d.id} />
                        <ConfirmButton message={t('doc.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
                      </form>
                    )}
                  </div>
                </div>

                {staff && (
                  <details className="mt-2 ps-8">
                    <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">
                      {history.length > 1 ? `${t('doc.versions')} (${history.length})` : t('doc.newVersion')}
                    </summary>
                    <div className="mt-3 space-y-4 rounded-xl bg-slate-50 p-4">
                      {history.length > 1 && (
                        <ul className="space-y-1.5 text-xs text-slate-600">
                          {history.map((v) => (
                            <li key={v.id} className="flex flex-wrap items-center gap-x-3">
                              <span className="font-semibold">{t('doc.versionN', { n: v.version })}</span>
                              <a href={`/api/documents/${v.id}`} className={linkCls} download>{v.name}</a>
                              <span>{formatBytes(v.size_bytes)} · {f.dateTime(v.created_at)}</span>
                              {v.is_current && <Badge tone="green">{t('doc.current')}</Badge>}
                            </li>
                          ))}
                        </ul>
                      )}
                      <form action={moveDocument} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={d.id} />
                        <div>
                          <label htmlFor={`mv-${d.id}`} className="mb-1 block text-xs font-medium text-slate-600">{t('doc.moveTo')}</label>
                          <input id={`mv-${d.id}`} name="folder" defaultValue={d.folder} maxLength={60} className={`${inputCls} max-w-[14rem] !py-1.5`} />
                        </div>
                        <button type="submit" className={smallBtnCls}>{t('common.save')}</button>
                      </form>
                      <DocumentUploader caseId={caseId ?? d.case_id} newVersionOf={d.id} canShare compact />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
