# LexDesk

Practice management for law firms, built to be **rented as a monthly subscription** to small firms in Pakistan.
Each firm gets a private workspace for its lawyers, juniors and clients. Payment is by local bank transfer,
confirmed by you; there are no paid third-party APIs.

Stack: Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Supabase (Postgres + Auth + Storage) · nodemailer (any SMTP).

## What it does

**For the platform owner (super admin)**
- Firms list and detail, per-firm subscription controls (plan, extend, suspend, reactivate)
- Billing queue: review bank-transfer proofs, confirm or reject; leads from the website; platform bank details and trial/grace settings
- Audit log, global search, clients directory

**For a law firm**
- Roles: **lawyer** (firm owner: everything, billing, team, subscription) and **junior** (staff: cases, clients, documents, tasks, time; no billing, team or subscription). More roles can be added later.
- Guided first-run onboarding for new firms
- Clients, cases (court, court case number, judge, stage), next hearing date and a printable **cause list**
- Calendar with hearings, meetings and deadlines (with hearing outcomes); tasks with assignee
- Documents with **folders and versions**; private storage, short-lived download links, client sharing per file
- Case messaging, private notes
- **Time tracking** and billable hours; invoices (also created from unbilled time); letter and invoice **templates**
- **Conflict-of-interest check**
- Per-client **WhatsApp / SMS reminders** as click-to-chat links (free; the lawyer taps send, nothing is sent automatically)
- **Data export** (CSV / JSON)
- Pagination and search on every list, plus a global search
- Subscription page: plan, bank details, submit a payment with proof

**For clients**: private portal with their own cases, shared documents, appointments and invoices, and messaging.

**Everyone**: English and **Urdu (right-to-left)** interface, dark mode, installable on phones, optional two-factor authentication (authenticator app).

**Subscriptions**: free trial, then active / past due (grace period, still usable with a banner) / suspended (workspace locked; only the subscription page works for the owner). The lock is computed from dates by the database on every request, so it works even if the daily job never runs. The daily job additionally stores the status and sends reminder emails.

## Quick start

    npm install
    cp .env.example .env.local        # fill in the Supabase values (see SETUP.md)
    # run supabase/schema.sql in the Supabase SQL Editor (safe to re-run)
    npm run create-admin -- you@example.com "StrongPass123" "Your Name"
    npm run dev                       # http://localhost:3000

Full instructions: [SETUP.md](SETUP.md). Going live: [docs/DEPLOY.md](docs/DEPLOY.md), [docs/SMTP.md](docs/SMTP.md), [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Development, production build, production server |
| `npm run typecheck` | `next typegen` + TypeScript check |
| `npm run lint` | ESLint |
| `npm run i18n-check` | English and Urdu dictionaries match (missing keys, placeholders) |
| `npm run create-admin -- email "Password1" "Name"` | Create or repair the super admin |
| `npm run reset-2fa -- email` | Remove a lost authenticator app from an account |
| `npm run seed-demo -- --yes` | Demo firm with sample data (test projects only) |
| `npm run clean-slate [-- --yes]` | Delete all data and all accounts except super admins |

## Structure

    app/admin     platform owner portal         app/lawyer   firm workspace (lawyer + junior)
    app/client    client portal                 app/api      document download, cron, export
    app/actions   server actions shared by roles
    components    shared UI (design system: Card, Table, Field, Badge, EmptyState, Skeleton...)
    lib           auth, plans, formatting, i18n, mail, limits, cron jobs
    lib/i18n      dictionaries: dict/en and dict/ur, split by area
    supabase      schema.sql (tables, row level security, functions)   scripts   admin tooling

Security model in one paragraph: access is by invitation only; all confidentiality is enforced by Postgres row level security, not just in the app; the service-role client is used only after a role check; documents live in a private bucket and are served through 60-second signed links; sign-in and sensitive actions are rate limited; important actions are written to the audit log.

## Languages

All text comes from `lib/i18n/dict/en/*.ts` and `lib/i18n/dict/ur/*.ts`. The Urdu dictionary is typed against the English one, so the compiler refuses a missing key.
- **New text**: add the key to the right English file, add the Urdu translation with the same key, use `t('your.key')` (server: `const { t } = await getI18n()`, client: `useI18n()`), then run `npm run i18n-check`.
- **New language**: add the code to `LOCALES`/`DIRECTION` in `lib/i18n/shared.ts`, create `dict/<code>/`, register it in `lib/i18n/index.ts` and the language switch. Use logical CSS classes (`ms-`, `pe-`, `start-`) so right-to-left layouts flip automatically.

## Theming and branding

Colours are tokens at the top of `app/globals.css` (brand, gold, alert, canvas/surface). Dark mode mirrors the `slate`/`brand` scales automatically; always-dark surfaces use `navy-*`. Product name and legal details come from `NEXT_PUBLIC_APP_NAME` and the `NEXT_PUBLIC_COMPANY_*` variables (`lib/brand.ts`); the logo is `public/logo.png`. Plans and prices (placeholders) are in `lib/plans.ts`.

## Before you charge anyone

Have a qualified lawyer review the Terms and Privacy pages, replace the placeholder company details, set the plan prices, and read [docs/OPERATIONS.md](docs/OPERATIONS.md) (including the honest list of known limitations).
