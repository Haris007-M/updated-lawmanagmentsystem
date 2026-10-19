# Setup guide

Flow: **super admin → creates (or approves) firms → each firm invites its juniors and clients.**
Everyone chooses their own password from a one-time link. Nobody can sign up on their own.

## 0. Requirements
Node.js 20.9 or newer (22 LTS recommended) and a free Supabase project.

## 1. Install

    npm install

## 2. Supabase project
1. Create a project at supabase.com (choose a region close to your users).
2. Project Settings → API: copy the **Project URL**, the **anon public** key and the **service_role** key.

## 3. Environment
Copy `.env.example` to `.env.local` and fill it in.

| Variable | Needed | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **Server only.** Never expose it or commit it |
| `NEXT_PUBLIC_SITE_URL` | yes in production | `https://your-domain.com`; used in email links |
| `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` | recommended | See [docs/SMTP.md](docs/SMTP.md). Without it, invitation links are shown on screen to copy and no reminder emails are sent |
| `CRON_SECRET` | yes in production | Long random string for the daily job |
| `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`, `NEXT_PUBLIC_JURISDICTION` | before launch | Branding and legal pages |
| `NEXT_PUBLIC_TIMEZONE` | optional | Default `Asia/Karachi` |

Restart `npm run dev` after every change to `.env.local`.

## 4. Database
Open `supabase/schema.sql`, **copy its contents**, paste into Supabase → SQL Editor → Run
(choose "Run this query" if it warns about destructive operations; nothing is deleted).
It creates the tables, security rules, functions, triggers and the two private storage buckets
(`case-documents`, `payment-proofs`). It is safe to re-run after every update, and safe on top of an older version.
Check: `select public.rate_limit_hit('test', 5, 60);` returns `true`.

## 5. Supabase dashboard settings
- **Authentication → Sign In / Providers → Email**: turn **OFF** "Allow new users to sign up". Keep email provider on. Turn off "Confirm email" is not needed (accounts are created pre-confirmed).
- **Authentication → URL Configuration**: Site URL = your app URL; add `<your app URL>/**` to Redirect URLs (also `http://localhost:3000/**` for development).
- **Authentication → Sign In / Providers → Email → Email OTP expiration**: leave at 3600 s (1 hour) or shorter. Invitation links stop working after this time; use "Resend invitation" afterwards.
- **Authentication → Multi-Factor**: make sure TOTP is enabled (default on).

## 6. Create your super admin (once)

    npm run create-admin -- you@example.com "StrongPass123" "Your Name"

Password: 10+ characters with a letter and a number. Sign in at `/login`; you land on `/admin`.
Then open **Settings** in the admin portal and fill in your **bank account details** (shown to firms when they pay) and the trial / grace days. Turn on two-factor for this account.

## 7. First firm
Admin → Firms → add a lawyer. They receive an invitation email (or you copy the link), set their password, accept the Terms and are guided through first-run onboarding. A trial subscription starts automatically.

## 8. Email
Follow [docs/SMTP.md](docs/SMTP.md) (free tier, recommended provider). Test by inviting yourself from another address.

## 9. Optional
- Demo data for screenshots on a **test** project: `npm run seed-demo -- --yes` (logins are printed).
- Start fresh before real customers: `npm run clean-slate` (preview) then `npm run clean-slate -- --yes`.
- Locked out of two-factor: `npm run reset-2fa -- someone@example.com`.
- Daily job (subscription status, reminders): [docs/DEPLOY.md](docs/DEPLOY.md#daily-job).
