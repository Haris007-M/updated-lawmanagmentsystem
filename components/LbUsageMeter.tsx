// "3 of 8 used" with a calm progress bar. Turns gold near the limit, crimson at it.
export default function LbUsageMeter({ label, used, max, usedText, maxText }: { label: string; used: number; max: number; usedText: string; maxText: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0
  const bar = pct >= 100 ? 'bg-alert-700' : pct >= 80 ? 'bg-gold-600' : 'bg-emerald-600'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-slate-500"><span dir="ltr">{usedText} / {maxText}</span></span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(used, max)} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
