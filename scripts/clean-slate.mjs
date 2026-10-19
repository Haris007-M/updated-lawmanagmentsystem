// Removes ALL test / demo data and every account except super admins, so you can start fresh.
//   * deletes cases, messages, notes, documents (and their files), events, tasks, invoices,
//     time entries, templates, bank-transfer payments (and their proofs) and leads
//   * deletes every lawyer, junior and client account (subscriptions and firm settings go with the lawyers)
//   * clears the audit log, rate-limit records and case-number counters
//   * KEEPS super admin accounts
// Usage:   npm run clean-slate            (shows what would be deleted, changes nothing)
//          npm run clean-slate -- --yes   (actually deletes)
// Uses plain HTTP (fetch), so it works on Node 18, 20 and 22.

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const confirmed = process.argv.includes('--yes')
const fail = (m) => { console.error(`\n✖ ${m}\n`); process.exit(1) }
if (!url || !key) fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
async function call(method, path, body, extra = {}) {
  const res = await fetch(`${url}${path}`, { method, headers: { ...headers, ...extra }, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) fail(`${method} ${path} failed (${res.status}): ${text}`)
  try { return text ? JSON.parse(text) : null } catch { return null }
}
const count = async (table, filter = '') => {
  const res = await fetch(`${url}/rest/v1/${table}?select=id${filter}`, { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } })
  if (!res.ok) fail(`Could not read ${table} (${res.status}). Did you run supabase/schema.sql?`)
  return Number((res.headers.get('content-range') ?? '*/0').split('/')[1])
}

// children first. (invoices are referenced by time_entries, so time_entries go before invoices)
const tables = ['time_entries', 'events', 'tasks', 'invoices', 'case_notes', 'case_messages', 'documents', 'cases', 'templates', 'payments', 'leads']
console.log('\nCurrent data:')
for (const t of tables) console.log(`  ${t.padEnd(14)} ${await count(t)}`)
const lawyers = await call('GET', '/rest/v1/profiles?select=id,email&role=eq.lawyer')
const clients = await call('GET', '/rest/v1/profiles?select=id,email&role=eq.client')
const juniors = await call('GET', '/rest/v1/profiles?select=id,email&role=eq.junior')
console.log(`  lawyers        ${lawyers.length}\n  juniors        ${juniors.length}\n  clients        ${clients.length}`)
console.log('  (super admin accounts are always kept)\n')

if (!confirmed) {
  console.log('Nothing was changed. To delete all of the above, run:\n  npm run clean-slate -- --yes\n')
  process.exit(0)
}

// 1) uploaded files
const docs = await call('GET', '/rest/v1/documents?select=storage_path')
const paths = docs.map((d) => d.storage_path)
for (let i = 0; i < paths.length; i += 100) {
  await call('DELETE', '/storage/v1/object/case-documents', { prefixes: paths.slice(i, i + 100) })
}
console.log(`✔ Removed ${paths.length} uploaded file(s)`)

const proofs = await call('GET', '/rest/v1/payments?select=proof_path&proof_path=not.is.null')
const proofPaths = proofs.map((p) => p.proof_path)
for (let i = 0; i < proofPaths.length; i += 100) {
  await call('DELETE', '/storage/v1/object/payment-proofs', { prefixes: proofPaths.slice(i, i + 100) })
}
console.log(`✔ Removed ${proofPaths.length} payment proof(s)`)

// 2) business data (children first)
for (const t of tables) await call('DELETE', `/rest/v1/${t}?id=not.is.null`, null, { Prefer: 'return=minimal' })
console.log('✔ Removed cases, messages, notes, documents, events, tasks, invoices, time entries, templates, payments and leads')

// 3) accounts: clients and juniors first (a lawyer cannot be removed while people still point at them)
for (const p of [...clients, ...juniors, ...lawyers]) {
  await call('DELETE', `/auth/v1/admin/users/${p.id}`)
}
console.log(`✔ Removed ${clients.length} client, ${juniors.length} junior and ${lawyers.length} lawyer account(s)`)

// 4) logs
await call('DELETE', '/rest/v1/audit_log?id=not.is.null', null, { Prefer: 'return=minimal' })
await call('DELETE', '/rest/v1/rate_limits?id=not.is.null', null, { Prefer: 'return=minimal' })
await call('DELETE', '/rest/v1/counters?lawyer_id=not.is.null', null, { Prefer: 'return=minimal' })
console.log('✔ Cleared audit log, rate limits and numbering counters\n\nDone. Sign in as super admin and create your real lawyers.\n')
