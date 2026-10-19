import { NextResponse, type NextRequest } from 'next/server'
import { getContext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { audit } from '@/lib/audit'
import { isUuid } from '@/lib/form'
import { PROOF_BUCKET } from '@/lib/constants'

// Opens a payment receipt: the firm that paid, or the super admin. Row level security decides (payments read policy),
// then a 60-second signed link is issued from the private bucket.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await getContext()
  if (!me || !isUuid(id) || !me.access_active || !me.mfa_ok) return new NextResponse('Not found', { status: 404 })
  if (me.role !== 'lawyer' && me.role !== 'super_admin') return new NextResponse('Forbidden', { status: 403 })

  const { data: pay } = await (await createClient()).from('payments').select('id, proof_path').eq('id', id).maybeSingle()
  if (!pay?.proof_path) return new NextResponse('Not found', { status: 404 })

  const { data, error } = await createAdminClient().storage.from(PROOF_BUCKET).createSignedUrl(pay.proof_path, 60)
  if (error || !data?.signedUrl) return new NextResponse('File unavailable', { status: 404 })
  await audit(me.id, 'payment.proof_viewed', pay.id)
  const res = NextResponse.redirect(data.signedUrl)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
