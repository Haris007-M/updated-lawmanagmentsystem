// Free "click to chat" links. No paid API: the lawyer's own WhatsApp opens with the message
// already typed, and they press send. Works for SMS too.

// Pakistani numbers: 0300 1234567 / 300-1234567 / +92 300 1234567 / 0092300... -> 923001234567
export function normalizePhone(raw: string | null | undefined, defaultCountry = '92'): string | null {
  if (!raw) return null
  let d = raw.replace(/[^\d+]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  else if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = defaultCountry + d.slice(1)
  else if (d.length === 10 && d.startsWith('3')) d = defaultCountry + d
  return d.length >= 10 && d.length <= 15 ? d : null
}

export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const n = normalizePhone(phone)
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null
}

export function smsLink(phone: string | null | undefined, text: string): string | null {
  const n = normalizePhone(phone)
  return n ? `sms:+${n}?&body=${encodeURIComponent(text)}` : null
}
