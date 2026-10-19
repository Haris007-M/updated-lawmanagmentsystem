// Minimal CSV writer. Starts with a BOM so Excel opens Urdu/UTF-8 text correctly, and
// neutralises "=cmd()" style cells (CSV injection) by prefixing them with an apostrophe.
export type CsvCell = string | number | boolean | null | undefined

function cell(v: CsvCell): string {
  if (v === null || v === undefined) return ''
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return '﻿' + [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
