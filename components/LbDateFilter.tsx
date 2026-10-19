import { inputCls } from './ui'

// From / to date inputs for a ListToolbar
export default function LbDateFilter({
  from, to, fromLabel, toLabel,
}: { from: string; to: string; fromLabel: string; toLabel: string }) {
  return (
    <>
      <input type="date" name="from" defaultValue={from} aria-label={fromLabel} title={fromLabel} className={`${inputCls} !w-auto`} />
      <input type="date" name="to" defaultValue={to} aria-label={toLabel} title={toLabel} className={`${inputCls} !w-auto`} />
    </>
  )
}
