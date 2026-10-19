import { NextResponse, type NextRequest } from 'next/server'
import { getContext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { loadFirmSettings } from '@/lib/lawyer-b-data'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const nl = (s: string) => esc(s).replace(/\r?\n/g, '<br>')

// Word opens HTML saved as .doc, so a lawyer can edit the letter further in Word.
// The letterhead comes from the firm's saved settings (never from the request).
export async function POST(request: NextRequest) {
  const me = await getContext()
  if (!me || !me.access_active || !me.mfa_ok || (me.role !== 'lawyer' && me.role !== 'junior') || me.billing === 'locked') {
    return new NextResponse('Forbidden', { status: 403 })
  }
  const form = await request.formData()
  const body = String(form.get('body') ?? '').slice(0, 30000)
  const title = String(form.get('title') ?? 'Letter').slice(0, 120)
  if (!body.trim()) return new NextResponse('Empty', { status: 400 })

  const firm = await loadFirmSettings(await createClient(), me.firm_id!)
  const head = [firm?.address, [firm?.phone, firm?.email].filter(Boolean).join('  |  '), firm?.ntn ? `NTN: ${firm.ntn}` : ''].filter(Boolean)
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.5;color:#111}h1{font-size:20pt;margin:0;text-align:center}
.head{text-align:center;font-size:9.5pt;color:#555;border-bottom:2px solid #a98b5e;padding-bottom:8pt;margin-bottom:18pt}
.foot{margin-top:28pt;border-top:1px solid #ccc;padding-top:6pt;text-align:center;font-size:9pt;color:#555}</style></head>
<body><h1>${esc(firm?.firm_name || me.firm_name || '')}</h1>
<div class="head">${head.map((l) => nl(l ?? '')).join('<br>')}</div>
<div>${nl(body)}</div>
${firm?.letter_footer ? `<div class="foot">${nl(firm.letter_footer)}</div>` : ''}
</body></html>`
  const file = title.replace(/[^A-Za-z0-9._ -]+/g, '_').trim().slice(0, 80) || 'letter'
  return new NextResponse('﻿' + html, {
    headers: {
      'Content-Type': 'application/msword; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}.doc"`,
      'Cache-Control': 'no-store',
    },
  })
}
