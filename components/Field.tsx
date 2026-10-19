import { hintCls, inputCls, labelCls } from './ui'

export function Field({
  label, name, id, type = 'text', required, placeholder, defaultValue, hint, autoComplete, maxLength, min, max, step, dir,
}: {
  label: string; name: string; id?: string; type?: string; required?: boolean
  placeholder?: string; defaultValue?: string | number | null; hint?: string
  autoComplete?: string; maxLength?: number; min?: number | string; max?: number | string; step?: number | string
  dir?: 'ltr' | 'rtl' | 'auto'
}) {
  const fid = id ?? name
  return (
    <div>
      <label htmlFor={fid} className={labelCls}>{label}</label>
      <input
        id={fid} name={name} type={type} required={required} placeholder={placeholder} autoComplete={autoComplete}
        defaultValue={defaultValue ?? undefined} maxLength={maxLength} min={min} max={max} step={step} dir={dir}
        aria-describedby={hint ? `${fid}-hint` : undefined} className={inputCls}
      />
      {hint && <p id={`${fid}-hint`} className={hintCls}>{hint}</p>}
    </div>
  )
}

export function TextArea({
  label, name, id, rows = 3, required, placeholder, defaultValue, maxLength = 4000, hint, ariaLabel,
}: {
  ariaLabel?: string; label?: string; name: string; id?: string; rows?: number; required?: boolean
  placeholder?: string; defaultValue?: string | null; maxLength?: number; hint?: string
}) {
  const fid = id ?? name
  return (
    <div>
      {label && <label htmlFor={fid} className={labelCls}>{label}</label>}
      <textarea
        id={fid} name={name} rows={rows} required={required} placeholder={placeholder}
        defaultValue={defaultValue ?? undefined} maxLength={maxLength} className={inputCls} aria-label={label ? undefined : ariaLabel}
        aria-describedby={hint ? `${fid}-hint` : undefined}
      />
      {hint && <p id={`${fid}-hint`} className={hintCls}>{hint}</p>}
    </div>
  )
}

export function Select({
  label, name, id, options, defaultValue, required, emptyLabel, hint,
}: {
  label: string; name: string; id?: string; options: { value: string; label: string }[]
  defaultValue?: string; required?: boolean; emptyLabel?: string; hint?: string
}) {
  const fid = id ?? name
  return (
    <div>
      <label htmlFor={fid} className={labelCls}>{label}</label>
      <select id={fid} name={name} required={required} defaultValue={defaultValue ?? ''} className={inputCls}>
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  )
}

export function Checkbox({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-gold-600 focus:ring-gold-500" />
        <span>{label}</span>
      </label>
      {hint && <p className={`${hintCls} ps-6`}>{hint}</p>}
    </div>
  )
}

// hint: "PDF, Word, Excel... Maximum 10 MB." (translated by the caller)
export function FileInput({
  name = 'file', label, hint, accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp', required = true,
}: { name?: string; label?: string; hint?: string; accept?: string; required?: boolean }) {
  return (
    <div>
      {label && <label htmlFor={name} className={labelCls}>{label}</label>}
      <input
        id={name} name={name} type="file" required={required} accept={accept}
        className="block w-full text-sm text-slate-700 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-100"
      />
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  )
}
