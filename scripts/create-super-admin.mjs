// Creates (or repairs) the platform's first super admin.
// Usage:  npm run create-admin -- you@example.com "StrongPassword1" "Your Name"
// Uses plain HTTP (fetch), so it works on Node 18, 20 and 22.

const [emailArg, password, ...nameParts] = process.argv.slice(2)
const email = (emailArg ?? '').trim().toLowerCase()
const fullName = nameParts.join(' ').trim() || 'Super Admin'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

if (!email || !password) {
  fail('Usage: npm run create-admin -- you@example.com "StrongPassword1" "Your Name"')
}
if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  fail('Password needs 10+ characters with at least one letter and one number.')
}
if (!url || !key) fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
}

async function call(method, path, body, extra = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { ...headers, ...extra },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {}
  return { ok: res.ok, status: res.status, json, text }
}

async function findUserId(targetEmail) {
  for (let page = 1; page <= 20; page++) {
    const r = await call('GET', `/auth/v1/admin/users?page=${page}&per_page=1000`)
    if (!r.ok) fail(`Could not list users (${r.status}): ${r.text}`)
    const users = r.json?.users ?? []
    const hit = users.find((u) => u.email?.toLowerCase() === targetEmail)
    if (hit) return hit.id
    if (users.length < 1000) return null
  }
  return null
}

let userId
const created = await call('POST', '/auth/v1/admin/users', {
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
})

if (created.ok && created.json?.id) {
  userId = created.json.id
  console.log('✔ Auth user created')
} else {
  userId = await findUserId(email)
  if (!userId) fail(`Could not create the user (${created.status}): ${created.text}`)
  const upd = await call('PUT', `/auth/v1/admin/users/${userId}`, {
    password,
    email_confirm: true,
  })
  if (!upd.ok) fail(`User exists but the password update failed (${upd.status}): ${upd.text}`)
  console.log('✔ Auth user already existed: password updated')
}

const prof = await call(
  'POST',
  '/rest/v1/profiles?on_conflict=id',
  {
    id: userId,
    email,
    full_name: fullName,
    role: 'super_admin',
    lawyer_id: null,
    is_active: true,
    password_set_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
  },
  { Prefer: 'resolution=merge-duplicates,return=minimal' }
)
if (!prof.ok) {
  fail(
    `Could not write the profile (${prof.status}): ${prof.text}\n` +
      '  → Did you paste and run the CONTENTS of supabase/schema.sql in the SQL Editor first?'
  )
}

console.log(`✔ Super admin ready: ${email}`)
console.log('  Sign in at /login, you will land on /admin.\n')
