import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : ''

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // no-referrer: setup links carry a token in the URL, never leak it to other sites
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    // the browser may talk to our Supabase project only (uploads go straight to its storage)
    value: `frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me; object-src 'none'${supabaseHost ? `; connect-src 'self' ${supabaseHost}` : ''}`,
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // uploads go browser -> storage directly; server actions only carry small forms
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    // keep visited pages in the browser's router cache for 30s: back/forward and tab switches are instant
    staleTimes: { dynamic: 30, static: 300 },
    optimizePackageImports: ['lucide-react'],
  },
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // never let browsers/proxies cache signed-in pages
      {
        source: '/(admin|lawyer|client|auth|locked)/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ]
  },
}

export default nextConfig
