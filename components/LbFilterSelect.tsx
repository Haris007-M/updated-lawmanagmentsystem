import { inputCls } from './ui'

// A <select> that lives inside a ListToolbar (plain GET form, works without JavaScript).
export default function LbFilterSelect({
  name, value, label, options,
}: { name: string; value: string; label: string; options: { value: string; label: string }[] }) {
  return (
    <select name={name} defaultValue={value} aria-label={label} className={`${inputCls} !w-auto min-w-[9rem]`}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
