import type { CSSProperties } from 'react'

// Invoices and letters are paper: always dark ink on white, also when the app is in dark mode
// (and when printing from dark mode). Setting the colour variables on the sheet pins them.
export const PAPER_STYLE = {
  '--color-surface': '#ffffff',
  '--color-slate-50': '#f8fafc', '--color-slate-100': '#f1f5f9', '--color-slate-200': '#e2e8f0', '--color-slate-300': '#cbd5e1',
  '--color-slate-400': '#94a3b8', '--color-slate-500': '#64748b', '--color-slate-600': '#475569', '--color-slate-700': '#334155',
  '--color-slate-800': '#1e293b', '--color-slate-900': '#0f172a',
  '--color-brand-700': '#334155', '--color-brand-800': '#1e293b', '--color-brand-900': '#0f172a',
  '--color-gold-600': '#a98b5e', '--color-gold-700': '#7f6641',
  '--color-alert-700': '#b91c1c',
  color: '#1e293b', background: '#ffffff', colorScheme: 'light',
} as CSSProperties
