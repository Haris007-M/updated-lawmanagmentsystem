# Running LexDesk as a rented service

## Onboarding a firm
1. Admin → Firms → add the lawyer (name, email). They get an invitation email, choose a password, accept Terms and Privacy, and follow the first-run guide (firm profile, first client, first case).
2. A **trial** starts automatically (days set under Admin → Settings). The owner sees a banner with the days left.
3. Offer a short call to import their first clients and cases. Suggest turning on two-factor.

## Taking payment (bank transfer)
1. The firm opens **Subscription**, picks a plan and number of months (longer terms get a discount, see `lib/plans.ts`), sees **your bank details** (set in Admin → Settings), pays, then submits the payment with reference, date and a proof (receipt image or PDF).
2. You get an email and the payment appears in **Admin → Billing**. Check your bank account, open the proof, then **Confirm** or **Reject** (with a reason).
3. Confirming extends the subscription from the current end date (or from today if expired) and reactivates a suspended firm. The firm owner is emailed in English and Urdu.
Never confirm before the money is in your account.

## Subscription states
- **Trial**, **Active**: normal.
- **Past due**: period ended; still usable during the grace period (default 5 days) with a banner; the owner is emailed daily.
- **Suspended**: workspace locked. The owner can still open the Subscription page; juniors and clients see a "workspace paused" page. **No data is deleted.** Confirming a payment (or an admin reactivation) unlocks everything.
You can also suspend, extend or change a plan manually from the firm's page. The lock is computed from dates on every request, so it applies even if the daily job did not run.

## Support
Set a support email and WhatsApp number (env variables and Admin → Settings). Password problems: the user uses "Forgot your password?"; lost authenticator: `npm run reset-2fa -- email` after you verify the person. The **audit log** shows who did what.

## WhatsApp and SMS reminders
These are **click-to-chat links** (`wa.me`, `sms:`): the lawyer taps the button, WhatsApp opens with the message typed, and they press send. Nothing is sent automatically and no paid API is involved. Automatic WhatsApp would need the paid WhatsApp Business API.

## Data export and leaving
Firms can export their data (CSV / JSON) from the app. Uploaded files can be downloaded individually; bulk file export is not built in. Admin can delete a firm's data on request (be careful: it is permanent).

## Backups
See `docs/DEPLOY.md`: the free Supabase tier has no point-in-time recovery. Do not rent this out without a backup routine.

## Plans and prices
`lib/plans.ts` holds the plans (Starter / Professional / Chambers), **placeholder prices in PKR**, junior / client / storage limits and the multi-month discounts. Edit, redeploy. Limits are enforced when adding juniors, clients and uploading files.

## Legal review checklist
The Terms and Privacy pages are **templates, not legal advice**. Before charging anyone, have a Pakistani lawyer review them, especially: data protection and client confidentiality, data location (Supabase region), retention and deletion, liability and uptime promises, refunds and the suspension policy, governing law and courts, and your company name and contact details (`NEXT_PUBLIC_COMPANY_NAME` etc.). Check whether bar council rules on client data apply to your customers.

## Known limitations (honest list)
- Payments are manual: you confirm bank transfers by hand.
- WhatsApp / SMS are click-to-chat, not automatic.
- The Dockerfile is untested; the main tested path is `npm run build` + `npm start` or Vercel.
- The Urdu translation was machine-assisted and needs review by a native speaker, especially legal terms.
- Email depends on a free SMTP tier (daily caps); Supabase free tier pauses inactive projects and has no point-in-time recovery.
- No bulk file export; no accounting or tax integration; no court e-filing or cause-list scraping.
- Roles are owner and junior only (more can be added later).
- Not load tested; sized for a handful of firms.
- Reminder emails fire once per item at the daily run time (about 10:00 Pakistan time) for the next day.
- Pricing, terms and policies are placeholders until you set them.
