import { thCls, tdCls } from './ui'

// Calm data table. On phones each row turns into a card (CSS only, see globals.css).
// Every <Td> needs a `label` (the column title) for that card view; use label="" for an actions cell.
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table role="table" className={`data-table w-full ${className}`}>{children}</table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead role="rowgroup" className="border-b border-slate-200/70 bg-slate-50/60">
      <tr role="row">{children}</tr>
    </thead>
  )
}

export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th role="columnheader" scope="col" className={`${thCls} ${className}`}>{children}</th>
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody role="rowgroup" className="divide-y divide-slate-200/60">{children}</tbody>
}

export function Tr({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr role="row" className={className}>{children}</tr>
}

export function Td({ children, label, className = '' }: { children?: React.ReactNode; label: string; className?: string }) {
  return <td role="cell" data-label={label} className={`${tdCls} ${className}`}>{children}</td>
}
