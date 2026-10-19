// Shared class strings: the whole look of forms, buttons and cards lives here.
export const inputCls =
  'block w-full h-10 max-sm:h-12 rounded-lg border border-slate-200 bg-surface-2 px-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25 disabled:cursor-not-allowed disabled:opacity-60 [&:is(textarea)]:h-auto [&:is(textarea)]:py-2.5'

const btn =
  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 disabled:pointer-events-none disabled:opacity-50 max-sm:h-11'
export const buttonCls = `${btn} bg-gold-500 text-on-gold font-semibold hover:bg-gold-400`
export const secondaryBtnCls = `${btn} border border-slate-200 bg-surface-2 text-slate-800 hover:border-slate-300 hover:bg-slate-100`
export const goldBtnCls = `${btn} h-11 px-5 text-sm bg-gold-500 text-on-gold font-semibold hover:bg-gold-400`
export const ghostOnDarkBtnCls = `${btn} border border-white/10 bg-white/5 text-white hover:bg-white/10`
export const dangerBtnCls = `${btn} border border-alert-200 bg-alert-50 text-alert-700 hover:bg-alert-100`
export const smallBtnCls = `${btn} h-8 px-2.5 text-xs border border-slate-200 bg-surface-2 text-slate-700 hover:border-slate-300 hover:text-slate-900 max-sm:h-10`

export const labelCls = 'mb-1.5 block text-[12.5px] font-medium text-slate-600'
export const hintCls = 'mt-1.5 text-xs leading-relaxed text-slate-500'
export const linkCls = 'text-[13.5px] font-medium text-gold-600 underline-offset-4 hover:text-gold-700 hover:underline'
export const dangerLinkCls = 'text-[13px] font-medium text-alert-700 underline-offset-4 hover:text-alert-800 hover:underline'

export const cardCls = 'rounded-xl border border-slate-200/80 bg-surface'

// table cells (used through components/Table.tsx)
export const thCls = 'px-4 py-2.5 text-start text-[11px] font-medium uppercase tracking-wider text-slate-500'
export const tdCls = 'px-4 py-3 text-[13.5px] text-slate-700'
