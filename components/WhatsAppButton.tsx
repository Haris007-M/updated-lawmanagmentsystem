import { MessageCircle, Smartphone } from 'lucide-react'
import { smsLink, whatsappLink } from '@/lib/whatsapp'
import { smallBtnCls } from './ui'

// Free click-to-chat links: opens WhatsApp (or the SMS app) with the message already typed.
// No paid API: the lawyer just presses send.
export default function WhatsAppButton({
  phone,
  message,
  whatsappLabel = 'WhatsApp',
  smsLabel = 'SMS',
  sms = true,
}: {
  phone: string | null | undefined
  message: string
  whatsappLabel?: string
  smsLabel?: string
  sms?: boolean
}) {
  const wa = whatsappLink(phone, message)
  if (!wa) return null
  const text = smsLink(phone, message)
  return (
    <span className="inline-flex flex-wrap gap-2">
      <a href={wa} target="_blank" rel="noopener noreferrer" className={smallBtnCls}>
        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> {whatsappLabel}
      </a>
      {sms && text && (
        <a href={text} className={smallBtnCls}>
          <Smartphone className="h-3.5 w-3.5" aria-hidden /> {smsLabel}
        </a>
      )}
    </span>
  )
}
