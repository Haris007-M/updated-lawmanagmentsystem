import Link from 'next/link'
import { FilePlus2, Plus } from 'lucide-react'
import { addStarter, deleteTemplate } from '@/app/lawyer/billing-actions'
import Card from '@/components/Card'
import ConfirmButton from '@/components/ConfirmButton'
import EmptyState from '@/components/EmptyState'
import ListToolbar from '@/components/ListToolbar'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import TabNav from '@/components/TabNav'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { buttonCls, dangerLinkCls, linkCls, smallBtnCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { STARTERS } from '@/lib/lawyer-b-templates'
import { first, ilikeOr, readPaging, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'
import type { TemplateRow } from '@/lib/types'

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const owner = me.role === 'lawyer'
  const sp = await searchParams
  const { t, f } = await getI18n()
  const kind = owner && first(sp.tab) === 'invoice' ? 'invoice' : 'letter'
  const paging = readPaging(sp)

  const sb = await createClient()
  let q = sb.from('templates').select('id, lawyer_id, kind, name, body, amount_cents, currency, created_at, updated_at', { count: 'exact' })
    .eq('kind', kind).order('name').range(paging.from, paging.to)
  if (paging.q) q = q.or(ilikeOr(['name', 'body'], paging.q))
  const { data, count } = await q
  const templates = (data ?? []) as TemplateRow[]
  const starters = STARTERS.filter((s) => s.kind === kind && !templates.some((x) => x.name === s.name))
  const basePath = '/lawyer/templates'

  return (
    <>
      <PageHeader
        title={t('nav.templates')}
        description={t('lb.tpl.subtitle')}
        actions={<>
          {kind === 'letter' && <Link href="/lawyer/templates/generate" className={buttonCls}><FilePlus2 className="h-4 w-4" aria-hidden />{t('lb.tpl.generate')}</Link>}
          <Link href={`/lawyer/templates/new?kind=${kind}`} className={kind === 'letter' ? smallBtnCls : buttonCls}><Plus className="h-4 w-4" aria-hidden />{t('lb.tpl.new')}</Link>
        </>}
      />
      {owner && (
        <div className="mb-5">
          <TabNav base={basePath} active={kind} tabs={[{ key: 'letter', label: t('lb.tpl.letters') }, { key: 'invoice', label: t('lb.tpl.invoices') }]} />
        </div>
      )}
      <ListToolbar basePath={basePath} q={paging.q} placeholder={t('lb.tpl.search')}>
        {kind === 'invoice' && <input type="hidden" name="tab" value="invoice" />}
      </ListToolbar>

      <Card padded={false} className="mb-6">
        {templates.length === 0 ? (
          <EmptyState kind="templates" title={paging.q ? t('list.noResults') : t('lb.tpl.none')} hint={paging.q ? t('list.noResultsHint') : t('lb.tpl.noneHint')} />
        ) : (
          <Table>
            <THead><Th>{t('lb.tpl.name')}</Th><Th>{t('lb.tpl.preview')}</Th>{kind === 'invoice' && <Th>{t('common.amount')}</Th>}<Th>{t('common.updated')}</Th><Th><span className="sr-only">{t('common.actions')}</span></Th></THead>
            <TBody>
              {templates.map((x) => (
                <Tr key={x.id}>
                  <Td label={t('lb.tpl.name')} className="font-medium text-slate-900">{x.name}</Td>
                  <Td label={t('lb.tpl.preview')}><span className="line-clamp-2 max-w-md text-slate-600">{x.body}</span></Td>
                  {kind === 'invoice' && <Td label={t('common.amount')}>{x.amount_cents ? f.money(x.amount_cents, x.currency ?? 'PKR') : '—'}</Td>}
                  <Td label={t('common.updated')}>{f.date(x.updated_at)}</Td>
                  <Td label="">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      {kind === 'letter'
                        ? <Link href={`/lawyer/templates/generate?template=${x.id}`} className={linkCls}>{t('lb.tpl.use')}</Link>
                        : <Link href={`/lawyer/billing/new?template=${x.id}`} className={linkCls}>{t('lb.tpl.use')}</Link>}
                      <Link href={`/lawyer/templates/${x.id}`} className={linkCls}>{t('common.edit')}</Link>
                      <form action={deleteTemplate}>
                        <input type="hidden" name="id" value={x.id} />
                        <ConfirmButton message={t('lb.tpl.confirmDelete')} className={dangerLinkCls}>{t('common.delete')}</ConfirmButton>
                      </form>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination total={count ?? 0} page={paging.page} size={paging.size} basePath={basePath} params={{ q: paging.q, tab: kind === 'invoice' ? 'invoice' : undefined }} />
      </Card>

      {starters.length > 0 && (
        <Card title={t('lb.tpl.starters')}>
          <p className="mb-4 text-sm text-slate-600">{t('lb.tpl.startersHint')}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {starters.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{s.body}</p>
                </div>
                <form action={addStarter}><input type="hidden" name="id" value={s.id} /><button type="submit" className={smallBtnCls}>{t('lb.tpl.addStarter')}</button></form>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
