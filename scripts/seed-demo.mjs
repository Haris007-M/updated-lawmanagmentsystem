// Fills a DEMO firm with realistic sample data so you can show the product with real-looking screens:
// owner lawyer, one junior, 3 clients, cases with hearings, tasks, time entries, invoices, a letter template.
// Usage:  npm run seed-demo -- --yes        (never run this on a production database)
// Safe to run twice: if the demo owner already exists it only prints the logins.
// Uses plain HTTP (fetch), so it works on Node 18, 20 and 22.

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const fail = (m) => { console.error(`\n✖ ${m}\n`); process.exit(1) }

if (!url || !key) fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
if (process.env.NODE_ENV === 'production') fail('Refusing to seed demo data when NODE_ENV=production.')
const isLocal = /localhost|127\.0\.0\.1/.test(url)
if (!isLocal && !process.argv.includes('--yes')) {
  fail(`This would create demo accounts in ${url}.\n  Only do that on a test project. If that is what you want, run:  npm run seed-demo -- --yes`)
}

const PASSWORD = 'DemoPass2026!'
const OWNER = { email: 'demo.lawyer@example.com', name: 'Ayesha Rahman', firm: 'Rahman & Associates', phone: '0300 1234567' }
const JUNIOR = { email: 'demo.junior@example.com', name: 'Hamza Qureshi', phone: '0333 7654321' }
const CLIENTS = [
  { email: 'demo.client1@example.com', name: 'Bilal Ahmed', phone: '0301 1112233' },
  { email: 'demo.client2@example.com', name: 'Sana Malik', phone: '0302 4445566' },
  { email: 'demo.client3@example.com', name: 'Usman Traders (Pvt) Ltd', phone: '0345 9998877' },
]

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
async function call(method, path, body, extra = {}) {
  const res = await fetch(`${url}${path}`, { method, headers: { ...headers, ...extra }, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  if (!res.ok) fail(`${method} ${path} failed (${res.status}): ${text}\n  → Did you run the CONTENTS of supabase/schema.sql in the SQL Editor first?`)
  return json
}
const insert = (table, rows) => call('POST', `/rest/v1/${table}`, rows, { Prefer: 'return=representation' })
const patch = (table, filter, row) => call('PATCH', `/rest/v1/${table}?${filter}`, row, { Prefer: 'return=minimal' })

async function createUser(email, name) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST', headers,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } }),
  })
  const json = await res.json()
  if (!res.ok || !json.id) fail(`Could not create ${email}: ${JSON.stringify(json)}`)
  return json.id
}

function printLogins() {
  console.log('\nSign in at /login with password:', PASSWORD)
  console.log('   Owner lawyer :', OWNER.email)
  console.log('   Junior       :', JUNIOR.email)
  CLIENTS.forEach((c) => console.log('   Client       :', c.email))
}

const existing = await call('GET', `/rest/v1/profiles?email=eq.${OWNER.email}&select=id`)
if (existing.length) {
  console.log('\nℹ Demo data already exists, nothing was changed.')
  printLogins()
  console.log('')
  process.exit(0)
}

const now = Date.now()
const day = 86400000
const iso = (offsetDays, hour = 10) => {
  const d = new Date(now + offsetDays * day)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}
const ymd = (offsetDays) => new Date(now + offsetDays * day).toISOString().slice(0, 10)
const stamp = new Date().toISOString()

console.log('Creating the demo firm, junior and clients...')
const ownerId = await createUser(OWNER.email, OWNER.name)
// the database trigger adds firm settings, preferences and a trial subscription for every lawyer
await insert('profiles', [{
  id: ownerId, email: OWNER.email, full_name: OWNER.name, role: 'lawyer',
  firm_name: OWNER.firm, phone: OWNER.phone, password_set_at: stamp, terms_accepted_at: stamp,
}])
await patch('firm_prefs', `firm_id=eq.${ownerId}`, { onboarded_at: stamp, hourly_rate_cents: 500000, default_currency: 'PKR' })
await patch('subscriptions', `firm_id=eq.${ownerId}`, { plan: 'professional', status: 'active', current_period_end: iso(25) })
await patch('firm_settings', `firm_id=eq.${ownerId}`, {
  firm_name: OWNER.firm, address: '12-B, Mall Road, Lahore', phone: OWNER.phone, email: OWNER.email,
  bank_details: 'Meezan Bank, Title: Rahman & Associates, A/C 0123456789, IBAN PK00MEZN0000000123456789',
})

const juniorId = await createUser(JUNIOR.email, JUNIOR.name)
await insert('profiles', [{
  id: juniorId, email: JUNIOR.email, full_name: JUNIOR.name, role: 'junior', lawyer_id: ownerId,
  phone: JUNIOR.phone, password_set_at: stamp, terms_accepted_at: stamp,
}])

const clientIds = []
for (const c of CLIENTS) {
  const id = await createUser(c.email, c.name)
  await insert('profiles', [{
    id, email: c.email, full_name: c.name, role: 'client', lawyer_id: ownerId,
    phone: c.phone, password_set_at: stamp, terms_accepted_at: stamp,
  }])
  clientIds.push(id)
}

console.log('Creating cases, hearings, tasks, time entries and invoices...')
// case numbers are generated by the database
const cases = await insert('cases', [
  { lawyer_id: ownerId, client_id: clientIds[0], title: 'Ahmed vs. City Developers', case_type: 'Property', status: 'in_progress',
    court: 'Lahore High Court', court_case_number: 'W.P. 4521/2026', judge: 'Justice A. Hussain', stage: 'Arguments',
    opposing_party: 'City Developers (Pvt) Ltd', opened_on: ymd(-45),
    description: 'Recovery of plot possession and damages for delayed handover.' },
  { lawyer_id: ownerId, client_id: clientIds[0], title: 'Tenancy dispute: Gulberg shop', case_type: 'Civil', status: 'open',
    court: 'Civil Court, Lahore', court_case_number: 'C.S. 118/2026', stage: 'Pleadings', opposing_party: 'M. Tariq', opened_on: ymd(-12),
    description: 'Eviction notice and arrears of rent.' },
  { lawyer_id: ownerId, client_id: clientIds[1], title: 'Malik family: inheritance partition', case_type: 'Family', status: 'on_hold',
    court: 'Family Court, Islamabad', stage: 'Evidence', opposing_party: 'Estate of late A. Malik', opened_on: ymd(-90),
    description: 'Partition of ancestral property among legal heirs.' },
  { lawyer_id: ownerId, client_id: clientIds[1], title: 'Malik: supply agreement review', case_type: 'Corporate', status: 'closed',
    opened_on: ymd(-120), description: 'Review and negotiation of a supply agreement.' },
  { lawyer_id: ownerId, client_id: clientIds[2], title: 'Usman Traders vs. Federal Board of Revenue', case_type: 'Tax', status: 'open',
    court: 'Appellate Tribunal Inland Revenue, Lahore', court_case_number: 'ITA 77/LB/2026', stage: 'Notice', opposing_party: 'FBR', opened_on: ymd(-20),
    description: 'Appeal against assessment order for tax year 2024.' },
])

await insert('case_messages', [
  { case_id: cases[0].id, author_id: ownerId, body: 'Good morning Bilal. The next hearing has been fixed. Please send the allotment letter when you can.' },
  { case_id: cases[0].id, author_id: clientIds[0], body: 'Thank you. I will upload the allotment letter and payment receipts today.' },
  { case_id: cases[2].id, author_id: juniorId, body: 'Hello Sana, we are waiting for the heirship certificate before proceeding.' },
])
await insert('case_notes', [
  { case_id: cases[0].id, author_id: ownerId, body: 'Strategy: lead with the delayed-handover clause; settlement range to be discussed after the hearing.' },
])
await insert('events', [
  { lawyer_id: ownerId, case_id: cases[0].id, title: 'Hearing: arguments on the application', kind: 'hearing', starts_at: iso(1, 4), location: 'Lahore High Court, Court Room 4', visible_to_client: true },
  { lawyer_id: ownerId, case_id: cases[0].id, title: 'Previous hearing', kind: 'hearing', starts_at: iso(-30, 4), location: 'Lahore High Court', visible_to_client: true, outcome: 'Notice issued. Adjourned for arguments.' },
  { lawyer_id: ownerId, case_id: cases[1].id, title: 'Hearing: framing of issues', kind: 'hearing', starts_at: iso(3, 4), location: 'Civil Court, Lahore', visible_to_client: true },
  { lawyer_id: ownerId, case_id: cases[4].id, title: 'Hearing: first appearance', kind: 'hearing', starts_at: iso(6, 5), location: 'ATIR, Lahore', visible_to_client: true },
  { lawyer_id: ownerId, case_id: cases[0].id, title: 'Client prep meeting', kind: 'meeting', starts_at: iso(0, 10), location: 'Office', visible_to_client: true },
  { lawyer_id: ownerId, case_id: cases[1].id, title: 'File written reply', kind: 'deadline', starts_at: iso(8, 7), visible_to_client: false },
])
await insert('tasks', [
  { lawyer_id: ownerId, case_id: cases[0].id, title: 'Draft rejoinder to opposing reply', due_date: ymd(2), priority: 'high', assigned_to: juniorId },
  { lawyer_id: ownerId, case_id: cases[1].id, title: 'Collect tenancy agreement from client', due_date: ymd(-1), priority: 'medium', assigned_to: juniorId },
  { lawyer_id: ownerId, title: 'Renew bar council subscription', due_date: ymd(20), priority: 'low' },
  { lawyer_id: ownerId, case_id: cases[2].id, title: 'Request heirship certificate copy', due_date: ymd(4), priority: 'medium', assigned_to: ownerId },
])
await insert('time_entries', [
  { lawyer_id: ownerId, user_id: ownerId, case_id: cases[0].id, entry_date: ymd(-5), minutes: 90, description: 'Drafting application and affidavit', billable: true, rate_cents: 500000 },
  { lawyer_id: ownerId, user_id: juniorId, case_id: cases[0].id, entry_date: ymd(-4), minutes: 180, description: 'Legal research on possession and damages', billable: true, rate_cents: 200000 },
  { lawyer_id: ownerId, user_id: juniorId, case_id: cases[1].id, entry_date: ymd(-2), minutes: 60, description: 'Preparing reply to notice', billable: true, rate_cents: 200000 },
  { lawyer_id: ownerId, user_id: ownerId, case_id: cases[4].id, entry_date: ymd(-1), minutes: 45, description: 'Client call and document review', billable: false, rate_cents: 0 },
])
await insert('invoices', [
  { lawyer_id: ownerId, client_id: clientIds[0], case_id: cases[0].id, description: 'Legal fees: pleadings and first appearance', amount_cents: 15000000, currency: 'PKR', status: 'sent', due_on: ymd(14) },
  { lawyer_id: ownerId, client_id: clientIds[1], case_id: cases[3].id, description: 'Contract review and negotiation', amount_cents: 8500000, currency: 'PKR', status: 'paid', due_on: ymd(-60), paid_on: ymd(-55) },
  { lawyer_id: ownerId, client_id: clientIds[1], case_id: cases[2].id, description: 'Consultation and document preparation', amount_cents: 4000000, currency: 'PKR', status: 'draft' },
])
await insert('templates', [
  { lawyer_id: ownerId, created_by: ownerId, kind: 'letter', name: 'Legal notice: demand for payment',
    body: 'Date: {{date}}\n\nTo: {{opposing_party}}\n\nSubject: Legal notice in respect of {{case_title}}\n\nUnder instructions from my client {{client_name}}, you are called upon to ...\n\n{{firm_name}}' },
])

console.log('\n✔ Demo data ready.')
printLogins()
console.log('\n⚠ Demo only: run  npm run clean-slate  before you add real customers.\n')
