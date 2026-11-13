import { BRAND, LEGAL } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import { normalizePhone, whatsappLink } from '@/lib/whatsapp'

export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
  email: LEGAL.supportEmail,
  // digits only, with country code, e.g. 923001234567 (empty when not set)
  whatsapp: normalizePhone(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP) ?? '',
}

export const PUBLIC_PATHS = ['/', '/pricing', '/contact', '/terms', '/privacy']

// "Chat on WhatsApp" link with a ready-written first message, or null when no number is set.
export async function getWhatsAppHref(): Promise<string | null> {
  if (!SITE.whatsapp) return null
  const { t } = await getI18n()
  return whatsappLink(SITE.whatsapp, t('site.contact.waText', { brand: BRAND.name }))
}
