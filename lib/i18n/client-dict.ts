import { CLIENT_KEYS, CLIENT_PREFIXES } from './client-keys'

const KEYS = new Set(CLIENT_KEYS)

// Only the words client components use are sent to the browser (the rest stays on the server).
export function clientDict(dict: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k in dict) {
    if (KEYS.has(k) || CLIENT_PREFIXES.some((p) => k.startsWith(p))) out[k] = dict[k]
  }
  return out
}
