// Loading placeholders that match the real layout (no jumping when data arrives).
export const Bar = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} />

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-5">
      <Bar className="mb-4 h-4 w-40" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => <Bar key={i} className={`h-3.5 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />)}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
        <Bar className="h-3 w-1/3" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((__, c) => <Bar key={c} className={`h-3.5 ${c === 0 ? 'w-1/3' : 'w-1/6'}`} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatsSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-surface p-5">
          <Bar className="h-3 w-20" />
          <Bar className="mt-4 h-8 w-24" />
          <Bar className="mt-3 h-3 w-28" />
        </div>
      ))}
    </div>
  )
}

// Default loading screen inside a portal (the shell stays, only the content is replaced).
export default function PageSkeleton() {
  return (
    <div aria-busy="true" role="status">
      <span className="sr-only">…</span>
      <div className="mb-8">
        <Bar className="h-8 w-64" />
        <Bar className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <StatsSkeleton />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  )
}
