'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { createCase } from '@/app/lawyer/practice-actions'
import { CASE_STATUSES, CASE_TYPES } from '@/lib/constants'
import type { ConflictHit } from '@/lib/lawyer-a-conflicts'
import { useI18n } from './I18nProvider'
import FormMessage from './FormMessage'
import { buttonCls, hintCls, inputCls, labelCls, linkCls } from './ui'

interface Opt { id: string; name: string; email: string }

// New-case form. If the conflict check finds something, the same form comes back with the matches
// and a confirmation box ("I have reviewed these"); every typed value is kept.
export default function CaseForm({ clients, defaultClient, today }: { clients: Opt[]; defaultClient: string; today: string }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(createCase, undefined)
  const v = state?.fields ?? {}
  let hits: ConflictHit[] = []
  try { hits = v.conflicts ? (JSON.parse(v.conflicts) as ConflictHit[]) : [] } catch { /* ignore */ }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-client" className={labelCls}>{t('common.client')}</label>
          <select key={`cl-${v.client_id ?? ""}`} id="c-client" name="client_id" required defaultValue={v.client_id ?? defaultClient} className={inputCls}>
            <option value="">{t('la.cases.selectClient')}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="c-title" className={labelCls}>{t('la.cases.title')}</label>
          <input id="c-title" name="title" required maxLength={200} defaultValue={v.title} placeholder={t('la.cases.titlePlaceholder')} className={inputCls} />
        </div>
        <div>
          <label htmlFor="c-type" className={labelCls}>{t('common.type')}</label>
          <select key={`ty-${v.case_type ?? ""}`} id="c-type" name="case_type" defaultValue={v.case_type ?? 'Other'} className={inputCls}>
            {CASE_TYPES.map((x) => <option key={x} value={x}>{t(`caseType.${x}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="c-status" className={labelCls}>{t('common.status')}</label>
          <select key={`st-${v.status ?? ""}`} id="c-status" name="status" defaultValue={v.status ?? 'open'} className={inputCls}>
            {CASE_STATUSES.map((x) => <option key={x} value={x}>{t(`caseStatus.${x}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="c-court" className={labelCls}>{t('la.case.court')}</label>
          <input id="c-court" name="court" maxLength={200} defaultValue={v.court} className={inputCls} />
        </div>
        <div>
          <label htmlFor="c-ccn" className={labelCls}>{t('la.case.courtNumber')}</label>
          <input id="c-ccn" name="court_case_number" maxLength={100} defaultValue={v.court_case_number} dir="ltr" className={inputCls} />
          <p className={hintCls}>{t('la.case.courtNumberHint')}</p>
        </div>
        <div>
          <label htmlFor="c-judge" className={labelCls}>{t('la.case.judge')}</label>
          <input id="c-judge" name="judge" maxLength={120} defaultValue={v.judge} className={inputCls} />
        </div>
        <div>
          <label htmlFor="c-stage" className={labelCls}>{t('la.case.stage')}</label>
          <input id="c-stage" name="stage" maxLength={100} defaultValue={v.stage} className={inputCls} />
        </div>
        <div>
          <label htmlFor="c-opp" className={labelCls}>{t('la.case.opposing')}</label>
          <input id="c-opp" name="opposing_party" maxLength={200} defaultValue={v.opposing_party} className={inputCls} />
          <p className={hintCls}>{t('la.case.opposingHint')}</p>
        </div>
        <div>
          <label htmlFor="c-opened" className={labelCls}>{t('la.case.opened')}</label>
          <input id="c-opened" name="opened_on" type="date" dir="ltr" defaultValue={v.opened_on || today} className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="c-desc" className={labelCls}>{t('la.case.summary')}</label>
        <textarea id="c-desc" name="description" rows={4} maxLength={4000} defaultValue={v.description} className={inputCls} />
        <p className={hintCls}>{t('la.case.summaryHint')}</p>
      </div>

      {hits.length > 0 && (
        <div role="alert" className="rounded-xl border border-alert-200 bg-alert-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-alert-700">
            <AlertTriangle className="h-4 w-4" aria-hidden /> {state?.error}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-800">
            {hits.map((h, i) => (
              <li key={i} className="rounded-lg bg-surface px-3 py-2">
                {h.kind === 'client' ? (
                  <>
                    <span className="font-medium">{t('la.conflict.isClient')}:</span>{' '}
                    {h.clientId ? <Link href={`/lawyer/clients/${h.clientId}`} className={linkCls} target="_blank">{h.label}</Link> : h.label}
                  </>
                ) : (
                  <>
                    <span className="font-medium">{t('la.conflict.opposingIn')}:</span>{' '}
                    <Link href={`/lawyer/cases/${h.caseId}`} className={linkCls} target="_blank">{h.caseNumber} · {h.caseTitle}</Link>
                    {h.otherParty ? ` (${h.otherParty})` : ''} — {h.label}
                  </>
                )}
              </li>
            ))}
          </ul>
          <label className="mt-4 flex items-start gap-2.5 text-sm font-medium text-slate-900">
            <input type="checkbox" name="conflict_ack" required className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[var(--color-gold-600)]" />
            {t('la.conflict.ack')}
          </label>
        </div>
      )}
      {hits.length === 0 && <FormMessage state={state} />}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonCls}>
          {pending ? t('invite.creating') : hits.length ? t('la.conflict.createAnyway') : t('la.cases.create')}
        </button>
        <Link href="/lawyer/cases" className={linkCls}>{t('common.cancel')}</Link>
      </div>
    </form>
  )
}
