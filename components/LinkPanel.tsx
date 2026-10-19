'use client'

import { useState } from 'react'
import { useI18n } from './I18nProvider'
import { secondaryBtnCls } from './ui'

// Shows a one-time setup link with a copy button (used when email delivery is not set up).
export default function LinkPanel({ link }: { link: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the field selects on focus so it can be copied by hand.
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-gold-200 bg-gold-50 p-3.5">
      <p className="text-xs text-gold-700">{t('link.hint')}</p>
      <div className="mt-2 flex gap-2">
        <input
          readOnly
          value={link}
          dir="ltr"
          aria-label="Link"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border border-gold-300 bg-surface px-2 py-1 text-xs text-slate-800"
        />
        <button type="button" onClick={copy} className={secondaryBtnCls}>
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>
    </div>
  )
}
