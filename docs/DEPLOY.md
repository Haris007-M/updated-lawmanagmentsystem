# Deploying

Any host that runs Node 20.9+ works. Build with `npm run build`, run with `npm start` (port 3000).
Set all variables from `.env.example` in the host's environment settings. `NEXT_PUBLIC_*` values are read **at build time**, so rebuild after changing them.

## Which host?
- **Vercel**: easiest, with built-in cron. **The free Hobby plan is for non-commercial use only**, so a paid SaaS needs a paid Vercel plan (Pro) or another host. Also Hobby functions have request size limits (documents are uploaded straight to Supabase storage, so that is fine) and limited cron frequency (daily is OK).
- **A small VPS** (any provider, 1 vCPU / 1-2 GB RAM is enough for 5-10 firms): run `npm start` behind Caddy or nginx with HTTPS, managed by systemd or pm2. A `Dockerfile` is included but **untested**; try it on staging first.
- Put the app in a region near Pakistan if you can (Supabase region matters too: pick one close to your host).

## Domain and HTTPS
Point your domain at the host, enable HTTPS, then set `NEXT_PUBLIC_SITE_URL` to it and add it to Supabase → Authentication → URL Configuration (Site URL and Redirect URLs).

## Daily job
`/api/cron/daily` (GET or POST, header `Authorization: Bearer <CRON_SECRET>`) stores the real subscription status, emails trial / renewal / overdue notices to firm owners, emails tomorrow's hearings and due tasks, and prunes old rate-limit rows. Access control does **not** depend on it (the database computes the lock on every request), but reminders do.

Choose one:
1. **Vercel**: `vercel.json` already schedules it daily at 05:00 UTC (10:00 Pakistan time). Vercel sends `CRON_SECRET` automatically as the Bearer token when that variable is set.
2. **GitHub Actions (free, any host)**: `.github/workflows/daily.yml`. Add repository secrets `APP_URL` and `CRON_SECRET`. You can also run it manually from the Actions tab.
3. **Server cron**: `0 5 * * * curl -fsS -X POST https://your-domain.com/api/cron/daily -H "Authorization: Bearer YOUR_SECRET"`.

Test it: call it once by hand and read the JSON summary (`"mail": "on"` means SMTP is configured).

## Backups
Supabase **free tier has no point-in-time recovery**, and free projects pause after a week of inactivity. Before you take paying customers:
- Use a paid Supabase plan (daily backups, no pausing), **or**
- schedule your own dump, e.g. a nightly cron or GitHub Action running  
  `pg_dump "$SUPABASE_DB_URL" --no-owner -Fc -f backup-$(date +%F).dump`  
  and copy it to storage outside Supabase (the connection string is in Project Settings → Database). Uploaded files live in Supabase Storage and are **not** part of the dump; the in-app data export (CSV/JSON) covers records but not files.
- Test a restore at least once.

## Release checklist
- [ ] `supabase/schema.sql` re-run after every update
- [ ] Environment variables set, `CRON_SECRET` long and random
- [ ] Sign-ups disabled in Supabase; redirect URLs set
- [ ] SMTP verified (domain, SPF/DKIM)
- [ ] Bank details filled in under Admin → Settings
- [ ] Terms and Privacy reviewed by a lawyer; company details set
- [ ] Super admin has two-factor on
- [ ] Backups configured and a restore tested
