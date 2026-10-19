import { createBrowserClient } from '@supabase/ssr'

// Browser client: used ONLY to send a file to a one-time signed upload address handed out by the server.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
