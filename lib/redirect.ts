// Only allow same-site relative redirects (blocks open-redirect via ?next=).
export function safeNext(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
