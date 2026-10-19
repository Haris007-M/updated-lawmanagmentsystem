'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { finalizeUpload, prepareUpload } from '@/app/actions/documents'
import { createClient } from '@/lib/supabase/client'
import { BUCKET, DOCUMENT_FOLDERS, MAX_UPLOAD_BYTES } from '@/lib/constants'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, hintCls, inputCls, labelCls } from './ui'

export interface CaseOption { id: string; title: string; case_number: string }

// Uploads straight from the browser to private storage with a one-time address from the server:
// works on any host (no request size limits) and keeps files off our server.
//  - caseId fixed  -> uploading inside one case
//  - cases given   -> shows a case picker (documents page)
//  - newVersionOf  -> uploads a new version of an existing document (folder and sharing are kept)
export default function DocumentUploader({
  caseId, cases, newVersionOf, canShare, compact = false, defaultFolder = 'General',
}: {
  caseId?: string
  cases?: CaseOption[]
  newVersionOf?: string
  canShare: boolean // staff can choose to share with the client; a client's uploads are always visible to the firm
  compact?: boolean
  defaultFolder?: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ error?: string; success?: string }>()
  const mb = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const file = fd.get('file')
    const cid = caseId ?? String(fd.get('case_id') ?? '')
    if (!cid) return setMsg({ error: t('doc.err.chooseCase') })
    if (!(file instanceof File) || file.size === 0) return setMsg({ error: t('doc.err.chooseFile') })
    if (file.size > MAX_UPLOAD_BYTES) return setMsg({ error: t('doc.err.tooLarge', { mb }) })

    setBusy(true)
    setMsg(undefined)
    try {
      const prep = await prepareUpload({ caseId: cid, fileName: file.name, size: file.size, newVersionOf })
      if (prep.error || !prep.path || !prep.token) return setMsg({ error: prep.error ?? t('doc.err.uploadFail') })

      const { error } = await createClient()
        .storage.from(BUCKET)
        .uploadToSignedUrl(prep.path, prep.token, file, { contentType: prep.contentType })
      if (error) return setMsg({ error: t('doc.err.uploadFail') })

      const res = await finalizeUpload({
        caseId: cid,
        path: prep.path,
        fileName: file.name,
        folder: String(fd.get('folder') ?? defaultFolder),
        visible: fd.get('visible_to_client') === 'on',
        newVersionOf,
      })
      if (res.error) return setMsg({ error: res.error })
      setMsg({ success: res.success })
      form.reset()
      router.refresh()
    } catch {
      setMsg({ error: t('doc.err.uploadFail') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'}>
        {cases && !caseId && (
          <div>
            <label htmlFor="up-case" className={labelCls}>{t('doc.chooseCase')}</label>
            <select id="up-case" name="case_id" required className={inputCls} defaultValue="">
              <option value="" disabled>{t('doc.chooseCasePlaceholder')}</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} · {c.title}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor={`up-file-${newVersionOf ?? 'new'}`} className={labelCls}>{t('doc.chooseFile')}</label>
          <input
            id={`up-file-${newVersionOf ?? 'new'}`} name="file" type="file" required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp"
            className="block w-full text-sm text-slate-700 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-100"
          />
          <p className={hintCls}>{t('doc.maxSize', { mb })}</p>
        </div>
        {canShare && !newVersionOf && (
          <div>
            <label htmlFor="up-folder" className={labelCls}>{t('doc.folderLabel')}</label>
            <input id="up-folder" name="folder" list="folder-options" defaultValue={defaultFolder} maxLength={60} className={inputCls} />
            <datalist id="folder-options">
              {DOCUMENT_FOLDERS.map((f) => <option key={f} value={f} />)}
            </datalist>
          </div>
        )}
      </div>
      {canShare && !newVersionOf && (
        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" name="visible_to_client" className="h-4 w-4 rounded border-slate-300 accent-gold-600" />
          {t('doc.visibleToClient')}
        </label>
      )}
      <FormMessage state={msg} />
      <button type="submit" disabled={busy} className={buttonCls}>
        {busy ? t('doc.uploading') : newVersionOf ? t('doc.newVersion') : t('doc.upload')}
      </button>
    </form>
  )
}
