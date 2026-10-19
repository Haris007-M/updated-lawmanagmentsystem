import { NextResponse, type NextRequest } from 'next/server'
import { getContext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { audit } from '@/lib/audit'
import { isUuid } from '@/lib/form'
import { BUCKET } from '@/lib/constants'

// Secure download: the document row is read with the CALLER's session (row level
// security decides if they may see it), then a 60-second signed link is issued.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await getContext()
  if (!me || !isUuid(id)) return new NextResponse('Not found', { status: 404 })
  // includes the 2FA check and the firm's subscription state
  if (!me.access_active || !me.mfa_ok || (me.billing === 'locked' && me.role !== 'super_admin')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('documents')
    .select('id, case_id, name, storage_path')
    .eq('id', id)
    .maybeSingle()
  if (!doc) return new NextResponse('Not found', { status: 404 })

  const { data, error } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUrl(doc.storage_path, 60, { download: doc.name })
  if (error || !data?.signedUrl) return new NextResponse('File unavailable', { status: 404 })

  await audit(me.id, 'document.downloaded', doc.id, { case_id: doc.case_id })
  const res = NextResponse.redirect(data.signedUrl)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
