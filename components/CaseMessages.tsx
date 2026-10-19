import { postMessage } from '@/app/actions/cases'
import { getI18n } from '@/lib/i18n'
import { nameOf, type NameMap } from '@/lib/data'
import type { MessageRow } from '@/lib/types'
import ActionForm from './ActionForm'
import { TextArea } from './Field'
import EmptyState from './EmptyState'

export default async function CaseMessages({
  caseId, meId, messages, names,
}: { caseId: string; meId: string; messages: MessageRow[]; names: NameMap }) {
  const { t, f } = await getI18n()
  return (
    <div>
      {messages.length === 0 ? (
        <EmptyState kind="generic" compact title={t('msgs.none')} hint={t('msgs.noneHint')} />
      ) : (
        <ul className="space-y-3" aria-label={t('msgs.none')}>
          {messages.map((m) => {
            const mine = m.author_id === meId
            return (
              <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-gold-500/12 text-slate-900 ring-1 ring-gold-500/20' : 'bg-slate-100 text-slate-900 ring-1 ring-slate-200'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-xs ${'text-slate-500'}`}>
                    {mine ? t('common.you') : nameOf(names, m.author_id, t('common.unknown'))} · {f.dateTime(m.created_at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <ActionForm action={postMessage} submitLabel={t('msgs.send')} pendingLabel={t('common.sending')} className="mt-5 space-y-3 border-t border-slate-200 pt-5">
        <input type="hidden" name="case_id" value={caseId} />
        <TextArea name="body" rows={3} required placeholder={t('msgs.placeholder')} ariaLabel={t('msgs.placeholder')} />
      </ActionForm>
    </div>
  )
}
