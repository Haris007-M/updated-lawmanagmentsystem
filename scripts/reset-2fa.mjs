// Emergency: removes the authenticator app from an account (lost phone, locked-out admin).
// Usage:  npm run reset-2fa -- someone@example.com
// Uses plain HTTP (fetch), so it works on Node 18, 20 and 22.

const email = (process.argv[2] ?? '').trim().toLowerCase()
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const fail = (m) => { console.error(`\n✖ ${m}\n`); process.exit(1) }

if (!email) fail('Usage: npm run reset-2fa -- someone@example.com')
if (!url || !key) fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

async function findUserId() {
  for (let page = 1; page <= 20; page++) {
    const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers })
    if (!r.ok) fail(`Could not list users (${r.status})`)
    const users = (await r.json()).users ?? []
    const hit = users.find((u) => u.email?.toLowerCase() === email)
    if (hit) return hit.id
    if (users.length < 1000) return null
  }
  return null
}

const id = await findUserId()
if (!id) fail(`No account found for ${email}`)

const list = await fetch(`${url}/auth/v1/admin/users/${id}/factors`, { headers })
if (!list.ok) fail(`Could not read factors (${list.status})`)
const body = await list.json()
const factors = Array.isArray(body) ? body : (body.factors ?? [])

for (const f of factors) {
  const d = await fetch(`${url}/auth/v1/admin/users/${id}/factors/${f.id}`, { method: 'DELETE', headers })
  if (!d.ok) fail(`Could not remove a factor (${d.status})`)
}

await fetch(`${url}/rest/v1/profiles?id=eq.${id}`, {
  method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ mfa_enabled: false }),
})
console.log(`\n✔ Removed ${factors.length} authenticator(s) from ${email}. They can sign in with their password and set 2FA up again.\n`)
