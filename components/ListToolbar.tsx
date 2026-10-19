import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { getI18n } from '@/lib/i18n'
import { buttonCls, inputCls, secondaryBtnCls } from './ui'

// Search box (+ optional filter controls as children) for any list. A plain GET form, so it works
// without JavaScript and the address bar always reflects the current search.
export default async function ListToolbar({
  basePath, q, placeholder, children, active = false,
}: {
  basePath: string
  q: string
  placeholder?: string
  children?: React.ReactNode // extra <select> filters, each with a `name`
  active?: boolean // true when any filter is applied (shows "Clear")
}) {
  const { t } = await getI18n()
  return (
    <form method="get" action={basePath} role="search" className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-60 sm:max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          name="q" defaultValue={q} type="search" maxLength={80}
          aria-label={placeholder ?? t('list.search')}
          placeholder={placeholder ?? t('list.searchPlaceholder')}
          className={`${inputCls} ps-9`}
        />
      </div>
      {children}
      <button type="submit" className={buttonCls}>{t('list.search')}</button>
      {(active || q) && (
        <Link href={basePath} className={secondaryBtnCls}><X className="h-4 w-4" />{t('list.clear')}</Link>
      )}
    </form>
  )
}
