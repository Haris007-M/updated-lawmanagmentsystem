import Link from 'next/link'
import { Search } from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import ListToolbar from '@/components/ListToolbar'
import { Badge } from '@/components/Badge'
import { requireRole } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { cleanTerm, first, ilikeOr, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'

// Global search for the super admin: firms, clients (accounts only) and leads. Never searches case contents.
export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole('super_admin')
  const { t } = await getI18n()
  const q = cleanTerm(first((await searchParams).q))
  const supabase = await createClient()

  const [firms, clients, leads] = q
    ? await Promise.all([
        supabase.from('profiles').select('id, email, full_name, firm_name').eq('role', 'lawyer').or(ilikeOr(['email', 'full_name', 'firm_name'], q)).limit(8),
        supabase.from('profiles').select('id, email, full_name').eq('role', 'client').or(ilikeOr(['email', 'full_name'], q)).limit(8),
        supabase.from('leads').select('id, name, email, phone, firm_name, status').or(ilikeOr(['name', 'email', 'phone', 'firm_name', 'city'], q)).limit(8),
      ])
    : [null, null, null]

  const firmRows = (firms?.data ?? []) as { id: string; email: string; full_name: string | null; firm_name: string | null }[]
  const clientRows = (clients?.data ?? []) as { id: string; email: string; full_name: string | null }[]
  const leadRows = (leads?.data ?? []) as { id: string; name: string; email: string | null; phone: string | null; firm_name: string | null; status: string }[]
  const none = q && !firmRows.length && !clientRows.length && !leadRows.length
  const enc = encodeURIComponent(q)

  return (
    <>
      <PageHeader title={t('nav.search')} description={t('adm.search.desc')} />
      <ListToolbar basePath="/admin/search" q={q} placeholder={t('shell.searchPlaceholder')} />

      {!q ? (
        <Card><EmptyState kind="search" title={t('adm.search.prompt')} hint={t('adm.search.promptHint')} /></Card>
      ) : none ? (
        <Card><EmptyState kind="search" title={t('list.noResults')} hint={t('list.noResultsHint')} /></Card>
      ) : (
        <div className="space-y-6">
          {firmRows.length > 0 && (
            <Card title={t('nav.firms')} padded={false} action={<Link href={`/admin/lawyers?q=${enc}`} className="text-sm font-medium text-brand-700 hover:underline">{t('adm.dash.viewAll')}</Link>}>
              <ul className="divide-y divide-slate-100">
                {firmRows.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/lawyers/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-900">{r.firm_name || r.full_name || r.email}</span><span className="block truncate text-xs text-slate-500" dir="ltr">{r.email}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {clientRows.length > 0 && (
            <Card title={t('nav.clients')} padded={false} action={<Link href={`/admin/clients?q=${enc}`} className="text-sm font-medium text-brand-700 hover:underline">{t('adm.dash.viewAll')}</Link>}>
              <ul className="divide-y divide-slate-100">
                {clientRows.map((r) => (
                  <li key={r.id} className="px-5 py-3"><p className="text-sm font-medium text-slate-900">{r.full_name}</p><p className="text-xs text-slate-500" dir="ltr">{r.email}</p></li>
                ))}
              </ul>
            </Card>
          )}
          {leadRows.length > 0 && (
            <Card title={t('nav.leads')} padded={false} action={<Link href={`/admin/leads?q=${enc}`} className="text-sm font-medium text-brand-700 hover:underline">{t('adm.dash.viewAll')}</Link>}>
              <ul className="divide-y divide-slate-100">
                {leadRows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{r.name}</p><p className="truncate text-xs text-slate-500" dir="ltr">{[r.email, r.phone].filter(Boolean).join(' · ')}</p></div>
                    <Badge>{t(`adm.lead.status.${r.status as 'new'}` as const)}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
