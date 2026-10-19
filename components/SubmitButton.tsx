'use client'

import { useFormStatus } from 'react-dom'
import { useI18n } from './I18nProvider'
import { buttonCls } from './ui'

// Submit button for plain <form action={serverAction}> forms: disables itself while sending.
export default function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()
  const { t } = useI18n()
  return (
    <button type="submit" disabled={pending} className={className ?? buttonCls}>
      {pending ? (pendingLabel ?? t('common.saving')) : children}
    </button>
  )
}
