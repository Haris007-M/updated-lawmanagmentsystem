// "12 of 30" with a thin progress bar; turns crimson when the limit is reached.
export default function UsageBar({ label, used, max, text }: { label: string; used: number; max: number; text: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0
  const full = max > 0 && used >= max
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className={`font-medium ${full ? 'text-alert-700' : 'text-slate-900'}`}>{text}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(used, max)}>
        <div className={`h-full rounded-full ${full ? 'bg-alert-700' : 'bg-gold-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
