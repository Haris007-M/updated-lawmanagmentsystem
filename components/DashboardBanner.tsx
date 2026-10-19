import Image from 'next/image'

// Greeting header at the top of each dashboard, with the portal's photo (public/images/banner-*.jpg).
export default function DashboardBanner({
  image,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  image?: string
  eyebrow?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <section className={`relative mb-6 flex flex-col justify-end overflow-hidden ${image ? 'sm:aspect-[1920/520]' : ''} rounded-xl border border-slate-200/80 bg-surface print:hidden`}>
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover object-center rtl:-scale-x-100" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/50 to-transparent rtl:bg-gradient-to-l" aria-hidden />
        </>
      )}
      <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)] rtl:[mask-image:linear-gradient(to_right,black,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute -top-24 end-0 h-56 w-96 rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          {eyebrow && <p className="text-xs font-medium text-gold-600">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[26px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[13.5px] text-slate-500">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </section>
  )
}
