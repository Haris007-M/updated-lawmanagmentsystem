// Rebrand the whole product from here (or set NEXT_PUBLIC_APP_NAME in .env.local).
export const BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'LexDesk',
  tagline: 'Practice management for modern law firms',
}

// Shown in the footer and on the Terms and Privacy pages. Set these in .env.local.
// Nothing is shown for a value you leave empty, so no placeholder text ever reaches visitors.
export const LEGAL = {
  company: process.env.NEXT_PUBLIC_COMPANY_NAME || BRAND.name,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
  updated: process.env.NEXT_PUBLIC_LEGAL_UPDATED || '13 November 2026',
}
