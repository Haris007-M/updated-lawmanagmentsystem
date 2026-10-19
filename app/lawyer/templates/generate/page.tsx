import LbLetterStudio from '@/components/LbLetterStudio'
import { Select } from '@/components/Field'
import PageHeader from '@/components/PageHeader'
import { secondaryBtnCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { loadCaseOptions, loadFirmSettings } from '@/lib/lawyer-b-data'
import { renderTemplate, STARTERS } from '@/lib/lawyer-b-templates'
import { first, type SearchParams } from '@/lib/paging'
import { createClient } from '@/lib/supabase/server'

export default async function GenerateLetterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireStaff()
  const sp = await searchParams
  const { t, f } = await getI18n()
  const sb = await createClient()
  const caseId = isUuid(first(sp.case)) ? first(sp.case) : ''
  const pick = first(sp.template)

  const [cases, tpl] = await Promise.all([
    loadCaseOptions(sb),
    sb.from('templates').select('id, name, body').eq('kind', 'letter').order('name').limit(100),
  ])
  const own = tpl.data ?? []
  const options = [
    ...own.map((x) => ({ value: x.id, label: x.name })),
    ...STARTERS.filter((s) => s.kind === 'letter').map((s) => ({ value: s.id, label: `${s.name} (${t('lb.tpl.starter')})` })),
  ]
  const chosen = isUuid(pick) ? own.find((x) => x.id === pick) : STARTERS.find((s) => s.kind === 'letter' && s.id === pick)

  let studio: React.ReactNode = null
  if (caseId && chosen) {
    const [{ data: c }, firm] = await Promise.all([
      sb.from('cases').select('case_number, title, case_type, court, court_case_number, judge, opposing_party, client_id').eq('id', caseId).maybeSingle(),
      loadFirmSettings(sb, me.firm_id),
    ])
    if (c) {
      const { data: client } = await sb.from('profiles').select('full_name, email, phone').eq('id', c.client_id).maybeSingle()
      const firmName = firm?.firm_name || me.firm_name || me.full_name || ''
      const text = renderTemplate(chosen.body, {
        client_name: client?.full_name ?? client?.email ?? '', client_email: client?.email ?? '', client_phone: client?.phone ?? '',
        case_number: c.case_number, case_title: c.title, case_type: c.case_type, court: c.court ?? '', court_case_number: c.court_case_number ?? '',
        judge: c.judge ?? '', opposing_party: c.opposing_party ?? '',
        date: f.date(new Date().toISOString()), firm_name: firmName, firm_address: firm?.address ?? '', firm_phone: firm?.phone ?? '',
        lawyer_name: me.full_name ?? me.email,
      })
      studio = (
        <LbLetterStudio initialText={text} title={`${chosen.name} - ${c.case_number}`}
          head={{ name: firmName, address: firm?.address ?? '', phone: firm?.phone ?? '', email: firm?.email ?? '', ntn: firm?.ntn ?? '', footer: firm?.letter_footer ?? '' }} />
      )
    }
  }

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={t('lb.tpl.generate')} description={t('lb.tpl.generateHint')} back={{ href: '/lawyer/templates', label: t('nav.templates') }} />
        <form method="get" action="/lawyer/templates/generate" className="mb-6 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Select label={t('common.case')} name="case" required defaultValue={caseId} emptyLabel={t('doc.chooseCasePlaceholder')}
            options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
          <Select label={t('lb.tpl.template')} name="template" required defaultValue={pick} emptyLabel={t('lb.tpl.chooseTemplate')} options={options} />
          <button type="submit" className={secondaryBtnCls}>{t('lb.tpl.render')}</button>
        </form>
      </div>
      {studio}
    </>
  )
}
