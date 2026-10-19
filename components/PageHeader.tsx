import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <header className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-[22px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
