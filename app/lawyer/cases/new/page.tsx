import Link from 'next/link'
import Card from '@/components/Card'
import CaseForm from '@/components/CaseForm'
import PageHeader from '@/components/PageHeader'
import { buttonCls } from '@/components/ui'
import { requireStaff } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { getI18n } from '@/lib/i18n'
import { firmClients } from '@/lib/lawyer-a-data'
import { todayISO } from '@/lib/tz'
import { createClient } from '@/lib/supabase/server'

export default async function NewCasePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const me = await requireStaff()
  const { client = '' } = await searchParams
  const { t } = await getI18n()
  const clients = await firmClients(await createClient(), me.firm_id)

  return (
    <>
      <PageHeader title={t('la.cases.new')} description={t('la.cases.newIntro')} back={{ href: '/lawyer/cases', label: t('la.cases.all') }} />
      {clients.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-700">{t('la.cases.needClient')}</p>
          <Link href="/lawyer/clients" className={`${buttonCls} mt-4`}>{t('la.clients.add')}</Link>
        </Card>
      ) : (
        <Card>
          <CaseForm clients={clients} defaultClient={isUuid(client) ? client : ''} today={todayISO()} />
        </Card>
      )}
    </>
  )
}
