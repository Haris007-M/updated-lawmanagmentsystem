import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import { TextArea } from '@/components/Field'
import { buttonCls, linkCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { getI18n } from '@/lib/i18n'
import { searchConflicts, type ConflictHit } from '@/lib/lawyer-a-conflicts'
import { first, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'

export default async function ConflictsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireStaff()
  const sp = await searchParams
  const { t } = await getI18n()
  const raw = first(sp.names).slice(0, 600)
  const terms = raw.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean)
  const searched = terms.length > 0
  const usable = terms.some((x) => x.length >= 3)
  const hits: ConflictHit[] = searched && usable ? await searchConflicts(await createClient(), terms) : []

  return (
    <>
      <PageHeader title={t('nav.conflicts')} description={t('la.conf.intro')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t('la.conf.check')} className="h-fit">
          <form method="get" action="/lawyer/conflicts" className="space-y-4">
            <TextArea label={t('la.conf.names')} name="names" rows={4} maxLength={600} defaultValue={raw} hint={t('la.conf.namesHint')} />
            <button type="submit" className={buttonCls}>{t('la.conf.run')}</button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {!searched ? (
            <Card><p className="text-sm text-slate-600">{t('la.conf.idle')}</p></Card>
          ) : !usable ? (
            <Card><p className="text-sm text-slate-600">{t('la.conf.tooShort')}</p></Card>
          ) : hits.length === 0 ? (
            <Card>
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> {t('la.conf.clear')}
              </p>
              <p className="mt-2 text-xs text-slate-500">{t('la.conf.clearHint')}</p>
            </Card>
          ) : (
            <Card title={t('la.conf.matches', { n: String(hits.length) })} className="border-alert-200">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-alert-700">
                <AlertTriangle className="h-4 w-4" aria-hidden /> {t('la.conf.review')}
              </p>
              <ul className="space-y-2 text-sm text-slate-800">
                {hits.map((h, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <span className="font-medium">
                      {h.kind === 'client' ? t('la.conflict.isClient') : h.kind === 'opposing' ? t('la.conflict.opposingIn') : t('la.conflict.sameTitle')}:
                    </span>{' '}
                    {h.kind === 'client' ? (
                      h.clientId ? <Link href={`/lawyer/clients/${h.clientId}`} className={linkCls}>{h.label}</Link> : h.label
                    ) : (
                      <>
                        <Link href={`/lawyer/cases/${h.caseId}`} className={linkCls}>{h.caseNumber} · {h.caseTitle}</Link>
                        {h.otherParty ? ` (${h.otherParty})` : ''}
                        {h.kind === 'opposing' && <span className="text-slate-600"> — {h.label}</span>}
                      </>
                    )}
                    {h.status && <span className="ms-2 text-xs text-slate-500">{t(`caseStatus.${h.status === 'closed' ? 'closed' : 'open'}`)}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
