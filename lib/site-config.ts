import { BRAND, LEGAL } from '@/lib/brand'

export const SITE = {
  name: BRAND.name,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
  email: LEGAL.supportEmail,
  whatsapp: (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '').replace(/\D/g, ''),
  trialDays: 14,
}

export const PUBLIC_PATHS = ['/', '/pricing', '/contact', '/terms', '/privacy']
