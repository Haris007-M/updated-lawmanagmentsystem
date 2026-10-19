import { cardCls } from './ui'

export default function Card({
  title,
  description,
  action,
  children,
  padded = true,
  className = '',
  id,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  padded?: boolean
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`${cardCls} overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}
