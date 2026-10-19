'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { dbError, getStr, isUuid } from '@/lib/form'
import { ALLOWED_FILES, BUCKET, MAX_UPLOAD_BYTES } from '@/lib/constants'
import { firmUsage } from '@/lib/limits'
import { getI18n } from '@/lib/i18n'
import type { Context } from '@/lib/types'

function refresh(caseId?: string) {
  revalidatePath('/lawyer/documents')
  revalidatePath('/client/documents')
  if (caseId) {
    revalidatePath(`/lawyer/cases/${caseId}`)
    revalidatePath(`/client/cases/${caseId}`)
  }
}

const isStaff = (me: Context) => me.role === 'lawyer' || me.role === 'junior'
const MB = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)

export type PrepareResult = { error?: string; path?: string; token?: string; contentType?: string }
export type FinalizeResult = { error?: string; success?: string }

// STEP 1 of an upload. The file itself goes from the browser straight to private storage
// (never through our server, so there is no request size limit problem on any host).
// Here we only check the permission, the size, the type and the plan's storage limit.
export async function prepareUpload(input: {
  caseId: string; fileName: string; size: number; newVersionOf?: string
}): Promise<PrepareResult> {
  const { t } = await getI18n()
  const me = await requireUser()
  if (!isStaff(me) && me.role !== 'client') return { error: t('doc.err.notAllowed') }
  if (!isUuid(input.caseId)) return { error: t('doc.err.chooseCase') }
  if (!input.size || input.size <= 0) return { error: t('doc.err.chooseFile') }
  if (input.size > MAX_UPLOAD_BYTES) return { error: t('doc.err.tooLarge', { mb: MB }) }

  const ext = (input.fileName.split('.').pop() ?? '').toLowerCase()
  const contentType = ALLOWED_FILES[ext]
  if (!contentType) return { error: t('doc.err.type') }
  if (!(await allow(`upload:${me.id}`, 60, 3600))) return { error: t('doc.err.tooMany') }

  // RLS: a person only finds cases they belong to
  const supabase = await createClient()
  const { data: found } = await supabase.from('cases').select('id, lawyer_id').eq('id', input.caseId).maybeSingle()
  if (!found) return { error: t('doc.err.notFound') }

  const usage = await firmUsage(found.lawyer_id)
  if (usage.storageBytes + input.size > usage.maxStorageBytes) return { error: t('msg.limit.storage') }

  const safeName = input.fileName.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-100)
  const path = `${input.caseId}/${crypto.randomUUID()}-${safeName}`
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) {
    console.error('signed upload url failed:', error?.message)
    return { error: t('doc.err.uploadFail') }
  }
  return { path, token: data.token, contentType }
}

// STEP 2: the file is in storage; record it. The size is read back from storage, not trusted from the browser.
export async function finalizeUpload(input: {
  caseId: string; path: string; fileName: string; folder: string; visible: boolean; newVersionOf?: string
}): Promise<FinalizeResult> {
  const { t } = await getI18n()
  const me = await requireUser()
  if (!isStaff(me) && me.role !== 'client') return { error: t('doc.err.notAllowed') }
  if (!isUuid(input.caseId) || !input.path.startsWith(`${input.caseId}/`)) return { error: t('doc.err.notFound') }

  const admin = createAdminClient()
  const dir = input.path.slice(0, input.path.lastIndexOf('/'))
  const base = input.path.slice(input.path.lastIndexOf('/') + 1)
  const { data: listed } = await admin.storage.from(BUCKET).list(dir, { search: base, limit: 5 })
  const obj = listed?.find((o) => o.name === base)
  const size = Number((obj?.metadata as { size?: number } | undefined)?.size ?? 0)
  if (!obj || size <= 0 || size > MAX_UPLOAD_BYTES) {
    if (obj) await admin.storage.from(BUCKET).remove([input.path])
    return { error: t('doc.err.uploadFail') }
  }

  const ext = (input.fileName.split('.').pop() ?? '').toLowerCase()
  const contentType = ALLOWED_FILES[ext]
  if (!contentType) {
    await admin.storage.from(BUCKET).remove([input.path])
    return { error: t('doc.err.type') }
  }

  const supabase = await createClient()
  const { data: found } = await supabase.from('cases').select('id, lawyer_id, client_id, case_number').eq('id', input.caseId).maybeSingle()
  if (!found) {
    await admin.storage.from(BUCKET).remove([input.path])
    return { error: t('doc.err.notFound') }
  }

  // a client's uploads are always visible to the firm; staff choose whether the client sees theirs
  let visible = me.role === 'client' ? true : input.visible
  let folder = getFolder(input.folder)
  let groupId: string | null = null

  // A new version keeps the folder and the sharing of the version before it.
  if (input.newVersionOf) {
    if (!isUuid(input.newVersionOf) || !isStaff(me)) {
      await admin.storage.from(BUCKET).remove([input.path])
      return { error: t('doc.err.notAllowed') }
    }
    const { data: prev } = await supabase
      .from('documents')
      .select('group_id, folder, visible_to_client')
      .eq('id', input.newVersionOf)
      .eq('case_id', input.caseId)
      .maybeSingle()
    if (!prev) {
      await admin.storage.from(BUCKET).remove([input.path])
      return { error: t('doc.err.notFound') }
    }
    groupId = prev.group_id
    folder = prev.folder
    visible = prev.visible_to_client
  }

  const { data: row, error } = await supabase
    .from('documents')
    .insert({
      case_id: input.caseId,
      uploaded_by: me.id,
      name: input.fileName.slice(0, 200),
      storage_path: input.path,
      size_bytes: size,
      mime_type: contentType,
      visible_to_client: visible,
      folder,
      ...(groupId ? { group_id: groupId } : {}),
    })
    .select('id')
    .single()

  if (error || !row) {
    await admin.storage.from(BUCKET).remove([input.path]) // never leave orphan files
    return { error: error ? dbError(error) : t('doc.err.saveFail') }
  }

  await audit(me.id, input.newVersionOf ? 'document.version_added' : 'document.uploaded', row.id, { case_id: input.caseId, name: input.fileName.slice(0, 200) })

  if (isStaff(me) && visible) {
    await notify({
      toUserId: found.client_id,
      subject: `A document was shared on case ${found.case_number}`,
      heading: 'New document',
      body: `Your lawyer shared a document on case ${found.case_number}.`,
      path: `/client/cases/${input.caseId}?tab=documents`,
      button: 'View documents',
      throttleKey: `doc:${input.caseId}`,
      throttleSeconds: 300,
    })
  } else if (me.role === 'client') {
    await notify({
      toUserId: found.lawyer_id,
      subject: `Your client sent a document on case ${found.case_number}`,
      heading: 'New document from your client',
      body: `A document was uploaded to case ${found.case_number}.`,
      path: `/lawyer/cases/${input.caseId}?tab=documents`,
      button: 'View documents',
      throttleKey: `doc:${input.caseId}`,
      throttleSeconds: 300,
    })
  }
  refresh(input.caseId)
  return { success: t('doc.uploaded', { name: input.fileName }) }
}

function getFolder(v: string): string {
  const s = v.trim().slice(0, 60)
  return s || 'General'
}

export async function setDocumentShared(formData: FormData) {
  const me = await requireUser()
  if (!isStaff(me)) return
  const id = getStr(formData, 'id', 40)
  if (!isUuid(id)) return

  const supabase = await createClient()
  const share = formData.get('visible') === 'true'
  const { data } = await supabase
    .from('documents')
    .update({ visible_to_client: share })
    .eq('id', id)
    .select('id, case_id')
    .maybeSingle()

  if (data && share) {
    const { data: c } = await supabase.from('cases').select('client_id, case_number').eq('id', data.case_id).maybeSingle()
    if (c) {
      await notify({
        toUserId: c.client_id,
        subject: `A document was shared on case ${c.case_number}`,
        heading: 'New document',
        body: `Your lawyer shared a document on case ${c.case_number}.`,
        path: `/client/cases/${data.case_id}?tab=documents`,
        button: 'View documents',
        throttleKey: `doc:${data.case_id}`,
        throttleSeconds: 300,
      })
    }
  }
  refresh(data?.case_id)
}

export async function moveDocument(formData: FormData) {
  const me = await requireUser()
  if (!isStaff(me)) return
  const id = getStr(formData, 'id', 40)
  if (!isUuid(id)) return
  const folder = getFolder(getStr(formData, 'folder', 60))
  const supabase = await createClient()
  const { data } = await supabase.from('documents').update({ folder }).eq('id', id).select('case_id').maybeSingle()
  refresh(data?.case_id)
}

export async function deleteDocument(formData: FormData) {
  const me = await requireUser()
  const id = getStr(formData, 'id', 40)
  if (!isUuid(id)) return

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('documents')
    .select('id, case_id, storage_path, name')
    .eq('id', id)
    .maybeSingle()
  if (!doc) return

  // RLS: firm staff can delete any document of their cases, clients only their own uploads.
  const { data: deleted } = await supabase.from('documents').delete().eq('id', id).select('id')
  if (deleted?.length) {
    await createAdminClient().storage.from(BUCKET).remove([doc.storage_path])
    await audit(me.id, 'document.deleted', id, { case_id: doc.case_id, name: doc.name })
  }
  refresh(doc.case_id)
}
