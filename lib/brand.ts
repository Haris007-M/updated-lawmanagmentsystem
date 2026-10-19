// Rebrand the whole product from here (or set NEXT_PUBLIC_APP_NAME in .env.local).
export const BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'LexDesk',
  tagline: 'Practice management for modern law firms',
}

// Used by the Terms and Privacy pages. Set these in .env.local before launch.
export const LEGAL = {
  company: process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'Your Company Name',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@example.com',
  jurisdiction: process.env.NEXT_PUBLIC_JURISDICTION ?? 'your jurisdiction',
  updated: process.env.NEXT_PUBLIC_LEGAL_UPDATED ?? 'October 2026',
}
