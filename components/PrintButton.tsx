'use client'

import { Printer } from 'lucide-react'
import { useI18n } from './I18nProvider'
import { secondaryBtnCls } from './ui'

export default function PrintButton({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <button type="button" onClick={() => window.print()} className={`${secondaryBtnCls} print:hidden`}>
      <Printer className="h-4 w-4" aria-hidden /> {label ?? t('common.printPdf')}
    </button>
  )
}
