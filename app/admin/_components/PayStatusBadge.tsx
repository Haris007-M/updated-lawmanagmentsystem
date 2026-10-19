import { Badge, type Tone } from '@/components/Badge'
import { getI18n } from '@/lib/i18n'

const TONE: Record<string, Tone> = { pending: 'amber', confirmed: 'green', rejected: 'red' }

export default async function PayStatusBadge({ status }: { status: 'pending' | 'confirmed' | 'rejected' }) {
  const { t } = await getI18n()
  return <Badge tone={TONE[status]}>{t(`adm.pay.status.${status}` as const)}</Badge>
}
