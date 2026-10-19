import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/lawyer', '/client', '/api', '/auth', '/login', '/locked', '/forgot-password'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
