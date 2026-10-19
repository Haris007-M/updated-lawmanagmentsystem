# Email (SMTP) on a free tier

LexDesk sends invitations, password resets, reminders and payment notices through any SMTP server. No paid API is required. Without SMTP the app still works: invitation links are shown on screen to copy and send yourself, but no reminders go out.

## Recommendation: Brevo (free plan)
Free plan: about **300 emails/day**, enough for 5-10 firms with reminders. Standard SMTP, works with a custom sender domain.

1. Create a Brevo account, then **Senders, Domains → add your domain** and add the DNS records it shows (**SPF, DKIM**, and DMARC if offered). Without them your mail lands in spam.
2. SMTP & API → **SMTP** tab → create an SMTP key.
3. Fill `.env.local`:

       SMTP_HOST=smtp-relay.brevo.com
       SMTP_PORT=587
       SMTP_USER=<your Brevo login email>
       SMTP_PASS=<the SMTP key, not your account password>
       MAIL_FROM=LexDesk <no-reply@your-domain.com>

## Alternatives
| Provider | Free tier | Notes |
|---|---|---|
| Brevo | ~300/day | Recommended. Adds a small "sent with Brevo" footer on the free plan |
| Resend | 100/day, 3,000/month | Clean developer experience: host `smtp.resend.com`, port 465, user `resend`, pass = API key. The daily cap is tight if many firms get reminders |
| Mailgun / SendGrid | small trial or limited free tiers | Terms change often; check before relying on them |
| Gmail / Google Workspace | limited | Not recommended for production: sending limits, app-password hassle, deliverability and account-suspension risk |

## Check it works
Invite yourself from another address; the email should arrive within a minute and not in spam. Then run the daily job once by hand and look for `"mail": "on"`.

## Notes
- Emails contain no case details or message text, only a link back into the app.
- Reminder emails carry English and Urdu text.
- If the provider limit is reached, sending fails quietly (logged) and the app keeps working.
