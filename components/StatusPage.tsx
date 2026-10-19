import Link from 'next/link'
import Logo from './Logo'

// Full-page message used by 404, error and locked screens (plain props so it also works in error boundaries).
export default function StatusPage({
  code,
  title,
  message,
  children,
}: {
  code: string
  title: string
  message: string
  children?: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
      <Link href="/" className="mb-10">
        <Logo size={40} />
      </Link>
      {code && <p className="bg-gradient-to-br from-brand-700 to-gold-500 bg-clip-text font-display text-8xl font-semibold leading-none text-transparent sm:text-9xl" aria-hidden>
        {code}
      </p>}
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-brand-900">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
    </main>
  )
}
