'use client'

import { useActionState } from 'react'
import type { ActionState } from '@/lib/types'
import { useI18n } from './I18nProvider'
import LinkPanel from './LinkPanel'
import { linkCls } from './ui'

export default function SetupLinkButton({
  action,
  id,
  label,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  id: string
  label: string
}) {
  const { t } = useI18n()
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="inline-block w-full max-w-sm text-end">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={`${linkCls} disabled:opacity-60`}>
        {pending ? t('common.loading') : label}
      </button>
      {state?.error && (
        <p role="alert" className="mt-2 rounded-lg bg-alert-50 px-2.5 py-1.5 text-start text-xs text-alert-700">{state.error}</p>
      )}
      {state?.success && !state.link && (
        <p role="status" className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-start text-xs text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">{state.success}</p>
      )}
      {state?.link && <div className="text-start"><LinkPanel link={state.link} /></div>}
    </form>
  )
}
