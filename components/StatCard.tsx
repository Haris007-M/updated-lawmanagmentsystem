import { VB_H, VB_W, areaPaths, barRects } from '@/lib/sparkline'
import { cardCls } from './ui'

type Tone = 'default' | 'warn' | 'good' | 'alert'

const COLOR: Record<Tone, string> = {
  default: '#c9a96e', // gold
  warn: '#a98b5e',
  good: '#34d399',
  alert: '#f87171',
}

// Decorative chart that sits BEHIND the numbers. Pure SVG, rendered on the server.
function BackgroundChart({ id, data, kind, color }: { id: string; data: number[]; kind: 'area' | 'bars'; color: string }) {
  const viewBox = `0 0 ${VB_W} ${VB_H}`
  if (kind === 'bars') {
    const bars = barRects(data)
    if (!bars.length) return null
    return (
      <svg viewBox={viewBox} preserveAspectRatio="none" className="h-full w-full" aria-hidden>
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={1} fill={color} opacity={b.filled ? 0.5 : 0.16} />
        ))}
      </svg>
    )
  }
  const paths = areaPaths(data)
  if (!paths) return null
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={paths.area} fill={`url(#${id})`} />
      <path d={paths.line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.85" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  series,
  chart = 'area',
  caption,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: Tone
  // numbers to draw behind the card (oldest first); omit for a plain card
  series?: number[]
  chart?: 'area' | 'bars'
  // tiny note explaining the chart, e.g. "New per week"
  caption?: string
}) {
  const valueCls =
    tone === 'alert' ? 'text-alert-700' : tone === 'warn' ? 'text-gold-700' : tone === 'good' ? 'text-emerald-300' : 'text-slate-900'
  const chartId = `sc-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <div className={`${cardCls} relative flex min-h-[8.5rem] flex-col overflow-hidden p-4 sm:min-h-[9.25rem] sm:p-5`}>

      {series && series.length > 0 && (
        <>
          <div className={`pointer-events-none absolute inset-x-0 h-[3.25rem] sm:h-14 ${caption ? 'bottom-6' : 'bottom-1'}`}>
            <BackgroundChart id={chartId} data={series} kind={chart} color={COLOR[tone]} />
          </div>
          {caption && (
            <span className="pointer-events-none absolute bottom-2 start-4 z-10 text-[10px] font-medium text-slate-400 sm:start-5">
              {caption}
            </span>
          )}
        </>
      )}

      <div className="relative z-10">
        <p className="text-[12.5px] font-medium text-slate-500">{label}</p>
        <p className={`mt-2 break-words text-2xl font-semibold leading-tight tracking-tight tabular-nums sm:text-[28px] ${valueCls}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}
