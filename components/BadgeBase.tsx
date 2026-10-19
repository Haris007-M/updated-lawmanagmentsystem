// Small status pill with a coloured dot: readable without relying on colour alone (the text says the status).
const TONES = {
  slate: 'text-slate-600 bg-slate-100 ring-slate-200 [--dot:#8892a2]',
  green: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20 [--dot:#34d399]',
  red: 'text-red-300 bg-red-500/10 ring-red-500/20 [--dot:#f87171]',
  amber: 'text-amber-300 bg-amber-500/10 ring-amber-500/20 [--dot:#fbbf24]',
  blue: 'text-sky-300 bg-sky-500/10 ring-sky-500/20 [--dot:#38bdf8]',
  indigo: 'text-indigo-300 bg-indigo-500/10 ring-indigo-500/20 [--dot:#818cf8]',
  gold: 'text-gold-700 bg-gold-500/10 ring-gold-500/25 [--dot:#c9a96e]',
}
export type Tone = keyof typeof TONES

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${TONES[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--dot)]" aria-hidden />
      {children}
    </span>
  )
}
