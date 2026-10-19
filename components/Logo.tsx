import Image from 'next/image'
import { BRAND } from '@/lib/brand'

// The PNG mark lives in /public/logo.png (replace it with your own to rebrand).
// tone="light" = white wordmark for dark backgrounds, "dark" = navy wordmark for light ones.
export default function Logo({
  size = 36,
  text = true,
  tone = 'dark',
  className = '',
}: {
  size?: number
  text?: boolean
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image src="/logo.png" alt={text ? '' : BRAND.name} width={size} height={size} priority className="shrink-0" />
      {text && (
        <span
          className={`font-display font-semibold tracking-tight ${tone === 'light' ? 'text-white' : 'text-brand-900'}`}
          style={{ fontSize: Math.round(size * 0.62) }}
        >
          {BRAND.name}
        </span>
      )}
    </span>
  )
}
