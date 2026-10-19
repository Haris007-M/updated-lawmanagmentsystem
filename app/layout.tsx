import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { BRAND } from '@/lib/brand'
import { getI18n } from '@/lib/i18n'
import I18nProvider from '@/components/I18nProvider'
import { clientDict } from '@/lib/i18n/client-dict'

// Self-hosted, preloaded, no layout shift. Inter for everything Latin; Noto Naskh only downloads on Urdu pages.
const inter = localFont({
  src: [
    { path: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})
const naskh = localFont({
  src: [{ path: '../node_modules/@fontsource-variable/noto-naskh-arabic/files/noto-naskh-arabic-arabic-wght-normal.woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-naskh',
  display: 'swap',
  declarations: [{ prop: 'unicode-range', value: 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF' }],
  preload: false,
})

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
  applicationName: BRAND.name,
  // "Add to Home Screen" on iPhone opens it like a native app
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

// viewportFit "cover" lets the app draw under the notch; the shell adds safe-area padding.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#070D1A',
  colorScheme: 'dark',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { locale, dir, dict } = await getI18n()
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={`dark ${inter.variable} ${naskh.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} dict={clientDict(dict)}>{children}</I18nProvider>
      </body>
    </html>
  )
}
