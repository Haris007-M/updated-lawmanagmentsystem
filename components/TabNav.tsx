import Link from 'next/link'

export default function TabNav({
  base,
  tabs,
  active,
  param = 'tab',
}: {
  base: string
  tabs: { key: string; label: string; count?: number }[]
  active: string
  param?: string
}) {
  return (
    <div className="no-scrollbar overflow-x-auto border-b border-slate-200">
      <nav className="-mb-px flex gap-7" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`${base}${base.includes('?') ? '&' : '?'}${param}=${tab.key}`}
            aria-current={tab.key === active ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-0.5 pb-3 text-sm font-medium transition ${
              tab.key === active
                ? 'border-gold-500 text-brand-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span className="ms-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{tab.count}</span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}
