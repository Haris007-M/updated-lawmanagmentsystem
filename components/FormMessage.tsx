import type { ActionState } from '@/lib/types'

export default function FormMessage({ state }: { state: ActionState }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-lg border border-alert-200 bg-alert-50 px-3.5 py-2.5 text-sm text-alert-700">
        {state.error}
      </p>
    )
  }
  if (state?.success) {
    return (
      <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
        {state.success}
      </p>
    )
  }
  return null
}
