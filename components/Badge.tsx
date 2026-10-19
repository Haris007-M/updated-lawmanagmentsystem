import { getI18n } from '@/lib/i18n'
import type { CaseStatus, InvoiceStatus, Priority } from '@/lib/constants'
import type { SubStatus } from '@/lib/types'
import { Badge, type Tone } from './BadgeBase'

export { Badge, type Tone }

const CASE_TONE: Record<CaseStatus, Tone> = { open: 'blue', in_progress: 'indigo', on_hold: 'amber', closed: 'slate' }
export async function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const { t } = await getI18n()
  return <Badge tone={CASE_TONE[status]}>{t(`caseStatus.${status}`)}</Badge>
}

const INV_TONE: Record<InvoiceStatus, Tone> = { draft: 'slate', sent: 'amber', paid: 'green', void: 'red' }
export async function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = await getI18n()
  return <Badge tone={INV_TONE[status]}>{t(`invoiceStatus.${status}`)}</Badge>
}

const PRIO_TONE: Record<Priority, Tone> = { low: 'slate', medium: 'blue', high: 'red' }
export async function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = await getI18n()
  return <Badge tone={PRIO_TONE[priority]}>{t(`priority.${priority}`)}</Badge>
}

const SUB_TONE: Record<SubStatus, Tone> = { trial: 'blue', active: 'green', past_due: 'amber', suspended: 'red', canceled: 'slate' }
export async function SubscriptionBadge({ status }: { status: SubStatus }) {
  const { t } = await getI18n()
  return <Badge tone={SUB_TONE[status]}>{t(`sub.${status}`)}</Badge>
}

export async function AccountStatusBadge({
  isActive, passwordSetAt, mfaEnabled,
}: { isActive: boolean; passwordSetAt: string | null; mfaEnabled?: boolean }) {
  const { t } = await getI18n()
  const main = !isActive ? <Badge tone="red">{t('account.suspended')}</Badge>
    : !passwordSetAt ? <Badge tone="amber">{t('account.invited')}</Badge>
    : <Badge tone="green">{t('account.active')}</Badge>
  if (!mfaEnabled) return main
  return <span className="inline-flex flex-wrap gap-1.5">{main}<Badge tone="blue">2FA</Badge></span>
}
