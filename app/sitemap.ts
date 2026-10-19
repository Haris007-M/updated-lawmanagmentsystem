import type { MetadataRoute } from 'next'
import { SITE, PUBLIC_PATHS } from '@/lib/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((p) => ({
    url: `${SITE.url}${p === '/' ? '' : p}`,
    changeFrequency: p === '/' || p === '/pricing' ? 'weekly' : 'monthly',
    priority: p === '/' ? 1 : p === '/pricing' || p === '/contact' ? 0.8 : 0.4,
  }))
}
