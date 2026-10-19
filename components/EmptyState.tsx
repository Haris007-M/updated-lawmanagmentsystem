import Illustration, { type IllustrationKind } from './Illustration'

export default function EmptyState({
  title, hint, kind = 'generic', action, compact = false,
}: { title: string; hint?: string; kind?: IllustrationKind; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center px-5 text-center ${compact ? 'py-8' : 'py-12'}`}>
      {!compact && <Illustration kind={kind} />}
      <p className={`${compact ? '' : 'mt-2 '}text-sm font-semibold text-slate-800`}>{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
