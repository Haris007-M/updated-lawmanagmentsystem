'use client'

import { useActionState, useEffect, useRef, useTransition } from 'react'
import type { ActionState } from '@/lib/types'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls } from './ui'

// Generic form for server actions.
// It submits via onSubmit (not the `action` prop) so React does NOT wipe the inputs
// when the server returns an error. On success the form is reset manually.
export default function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  className = 'space-y-4',
  resetOnSuccess = true,
  buttonClassName,
  footer,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  children: React.ReactNode
  submitLabel?: string
  pendingLabel?: string
  className?: string
  resetOnSuccess?: boolean
  buttonClassName?: string
  // extra element rendered beside the submit button (e.g. a cancel link)
  footer?: React.ReactNode
}) {
  const { t } = useI18n()
  const [state, formAction, pending] = useActionState(action, undefined)
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success && resetOnSuccess) ref.current?.reset()
  }, [state, resetOnSuccess])

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => {
          formAction(data)
        })
      }}
    >
      {children}
      <FormMessage state={state} />
      {state?.link && (
        <input
          readOnly
          value={state.link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Link"
          dir="ltr"
          className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClassName ?? buttonCls}>
          {pending ? (pendingLabel ?? t('common.saving')) : (submitLabel ?? t('common.save'))}
        </button>
        {footer}
      </div>
    </form>
  )
}
