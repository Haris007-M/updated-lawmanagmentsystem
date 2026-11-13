import { CalendarDays, Gavel, Receipt } from 'lucide-react'

// A picture of the product for the landing page: sample data only, built in code so it is sharp
// on every screen and costs no image download. Decorative, so hidden from screen readers.
const ROWS = [
  { time: '09:00', court: 'Lahore High Court', title: 'Malik v. Zafar Textiles', stage: 'Arguments', tone: 'gold' },
  { time: '10:30', court: 'District Court, Lahore', title: 'State v. Rauf', stage: 'Evidence', tone: 'slate' },
  { time: '11:15', court: 'Banking Court No. 2', title: 'HBL v. Siddiqui Traders', stage: 'Hearing', tone: 'slate' },
  { time: '12:40', court: 'Family Court', title: 'Noor v. Noor', stage: 'Reply filed', tone: 'emerald' },
] as const

const TONE = {
  gold: 'bg-gold-500/15 text-gold-300 ring-gold-500/30',
  slate: 'bg-white/5 text-slate-300 ring-white/10',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
} as const

export default function AppPreview() {
  return (
    <div aria-hidden dir="ltr" className="relative mx-auto w-full max-w-xl select-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-gold-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-900/90 shadow-2xl shadow-black/50 ring-1 ring-black/40 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ms-3 rounded-md bg-white/5 px-3 py-0.5 text-[11px] text-slate-400">Cause list · Tomorrow</span>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { icon: Gavel, label: 'Active cases', value: '48' },
            { icon: CalendarDays, label: 'Hearings this week', value: '12' },
            { icon: Receipt, label: 'Unbilled', value: 'PKR 185,000' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <Icon className="h-4 w-4 text-gold-400" />
              <p className="mt-2 text-[11px] text-slate-400">{label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white sm:text-base">{value}</p>
            </div>
          ))}
        </div>

        <ul className="space-y-2 px-4 pb-4">
          {ROWS.map((r) => (
            <li key={r.title} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <span className="w-11 shrink-0 text-xs font-semibold tabular-nums text-gold-300">{r.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-white">{r.title}</span>
                <span className="block truncate text-[11px] text-slate-400">{r.court}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${TONE[r.tone]}`}>{r.stage}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
