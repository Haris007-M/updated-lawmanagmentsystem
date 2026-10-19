'use client'

import { useState } from 'react'
import { FileDown, Printer } from 'lucide-react'
import { useI18n } from './I18nProvider'
import { PAPER_STYLE } from '@/lib/lawyer-b-paper'
import { inputCls, labelCls, secondaryBtnCls, buttonCls, hintCls } from './ui'

export interface Letterhead { name: string; address: string; phone: string; email: string; ntn: string; footer: string }

// Edit the letter on the left, see the paper on the right. Print it, or download a Word-compatible file.
export default function LbLetterStudio({ initialText, head, title }: { initialText: string; head: Letterhead; title: string }) {
  const { t } = useI18n()
  const [text, setText] = useState(initialText)
  const contact = [head.address, [head.phone, head.email].filter(Boolean).join('  ·  ')].filter(Boolean)

  return (
    <div className="grid gap-6 lg:grid-cols-2 print:block">
      <div className="print:hidden">
        <label htmlFor="letter-text" className={labelCls}>{t('lb.tpl.letterText')}</label>
        <textarea id="letter-text" value={text} onChange={(e) => setText(e.target.value)} rows={22} className={`${inputCls} font-mono text-[13px] leading-6`} />
        <p className={hintCls}>{t('lb.tpl.letterHint')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className={buttonCls}><Printer className="h-4 w-4" aria-hidden />{t('common.printPdf')}</button>
          <form method="post" action="/api/letters" className="inline">
            <input type="hidden" name="body" value={text} />
            <input type="hidden" name="title" value={title} />
            <button type="submit" className={secondaryBtnCls}><FileDown className="h-4 w-4" aria-hidden />{t('lb.tpl.downloadDoc')}</button>
          </form>
        </div>
      </div>

      <div style={PAPER_STYLE} className="print-sheet min-h-[30rem] rounded-xl border border-slate-200 p-6 shadow-sm sm:p-10 print:min-h-0 print:rounded-none print:border-0 print:p-0 print:shadow-none" aria-label={t('lb.tpl.preview')}>
        <header className="border-b-2 border-gold-600 pb-4 text-center">
          <p className="font-display text-2xl font-semibold text-slate-900">{head.name}</p>
          {contact.map((l, i) => <p key={i} className="mt-0.5 whitespace-pre-line text-xs text-slate-500">{l}</p>)}
          {head.ntn && <p className="text-xs text-slate-500">NTN: <span dir="ltr">{head.ntn}</span></p>}
        </header>
        <div className="mt-8 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800">{text}</div>
        {head.footer && <p className="mt-10 whitespace-pre-line border-t border-slate-200 pt-3 text-center text-xs text-slate-500">{head.footer}</p>}
      </div>
    </div>
  )
}
