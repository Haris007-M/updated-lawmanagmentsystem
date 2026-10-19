import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getI18n } from '@/lib/i18n'
import { smallBtnCls } from './ui'

// Server-rendered pager. Keeps every other query parameter (search, filters) in the links.
export default async function Pagination({
  total, page, size, basePath, params = {},
}: {
  total: number
  page: number
  size: number
  basePath: string
  params?: Record<string, string | undefined>
}) {
  const { t, f } = await getI18n()
  const pages = Math.max(1, Math.ceil(total / size))
  if (total <= size) return null

  const href = (p: number) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') sp.set(k, v)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  const from = (page - 1) * size + 1
  const to = Math.min(total, page * size)

  // 1 … 4 5 [6] 7 8 … 20
  const nums: (number | '…')[] = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p)
    else if (nums[nums.length - 1] !== '…') nums.push('…')
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 print:hidden">
      <p className="text-xs text-slate-500">{t('list.showing', { from: f.number(from), to: f.number(to), total: f.number(total) })}</p>
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={href(page - 1)} className={smallBtnCls} rel="prev"><ChevronLeft className="h-4 w-4 rtl:rotate-180" />{t('list.prev')}</Link>
        ) : (
          <span className={`${smallBtnCls} pointer-events-none opacity-40`}><ChevronLeft className="h-4 w-4 rtl:rotate-180" />{t('list.prev')}</span>
        )}
        <span className="hidden items-center gap-1 sm:flex">
          {nums.map((n, i) =>
            n === '…' ? (
              <span key={`e${i}`} className="px-1 text-slate-400">…</span>
            ) : (
              <Link
                key={n} href={href(n)} aria-current={n === page ? 'page' : undefined}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium ${
                  n === page ? 'bg-gold-500 text-on-gold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >{f.number(n)}</Link>
            )
          )}
        </span>
        <span className="px-2 text-xs text-slate-500 sm:hidden">{t('list.page', { page, pages })}</span>
        {page < pages ? (
          <Link href={href(page + 1)} className={smallBtnCls} rel="next">{t('list.next')}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></Link>
        ) : (
          <span className={`${smallBtnCls} pointer-events-none opacity-40`}>{t('list.next')}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></span>
        )}
      </div>
    </nav>
  )
}
