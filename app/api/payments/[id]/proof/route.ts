import { NextResponse, type NextRequest } from 'next/server'
import { getContext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUuid } from '@/lib/form'
import { PROOF_BUCKET } from '@/lib/constants'

// Payment proof (bank transfer receipt): only the super admin and the firm that paid may open it.
// The row is read with the CALLER's session (row level security), then a 60-second signed link is issued.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await getContext()
  if (!me || !isUuid(id) || !me.access_active || !me.mfa_ok) return new NextResponse('Not found', { status: 404 })
  if (me.role !== 'super_admin' && me.role !== 'lawyer') return new NextResponse('Forbidden', { status: 403 })

  const supabase = await createClient()
  const { data: pay } = await supabase.from('payments').select('id, proof_path').eq('id', id).maybeSingle()
  if (!pay?.proof_path) return new NextResponse('Not found', { status: 404 })

  const { data, error } = await createAdminClient().storage.from(PROOF_BUCKET).createSignedUrl(pay.proof_path, 60)
  if (error || !data?.signedUrl) return new NextResponse('File unavailable', { status: 404 })

  const res = NextResponse.redirect(data.signedUrl)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
