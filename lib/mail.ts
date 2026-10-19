import 'server-only'
import nodemailer from 'nodemailer'
import { BRAND } from '@/lib/brand'

// Works with any SMTP provider (Resend, Brevo, Mailgun, Gmail app password, ...).
export function mailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM
  )
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type SendResult = { ok: true } | { ok: false; error: string }

async function send(to: string, subject: string, text: string, html: string): Promise<SendResult> {
  try {
    await getTransporter().sendMail({ from: process.env.MAIL_FROM, to, subject, text, html })
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    console.error('sendMail failed:', message)
    return { ok: false, error: message }
  }
}

function layout(heading: string, body: string, link: string, button: string, footer = 'If you were not expecting this email, you can ignore it.') {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 16px">${heading}</h2>
  <p style="line-height:1.55;white-space:pre-line">${body}</p>
  <p style="margin:24px 0"><a href="${esc(link)}" style="background:#c5a880;color:#0f172a;font-weight:600;padding:12px 22px;border-radius:6px;text-decoration:none;display:inline-block">${button}</a></p>
  <p style="font-size:12px;color:#64748b;line-height:1.5">If the button does not work, copy this address into your browser:<br>${esc(link)}</p>
  <p style="font-size:12px;color:#64748b">${footer}</p>
</div>`
}

export function sendInviteEmail(p: { to: string; name: string; invitedBy: string; link: string }) {
  const subject = `You have been invited to ${BRAND.name}`
  const text = `Hello ${p.name},\n\n${p.invitedBy} invited you to ${BRAND.name}. Choose your password here:\n${p.link}\n\nIf you were not expecting this, ignore this email.`
  const html = layout(
    `Welcome, ${esc(p.name)}`,
    `${esc(p.invitedBy)} invited you to ${BRAND.name}. Click below to choose your password.`,
    p.link,
    'Set my password'
  )
  return send(p.to, subject, text, html)
}

export function sendResetEmail(p: { to: string; name: string; link: string }) {
  const subject = `Reset your ${BRAND.name} password`
  const text = `Hello ${p.name},\n\nUse this link to choose a new password:\n${p.link}\n\nIf you did not ask for this, ignore this email.`
  const html = layout(
    'Reset your password',
    `Hello ${esc(p.name)}, click below to choose a new password.`,
    p.link,
    'Reset password'
  )
  return send(p.to, subject, text, html)
}

// Short "something happened, sign in to see it" emails. They deliberately contain no
// case details or message text, only a link back into the app.
export function sendNotificationEmail(p: {
  to: string; name: string; subject: string; heading: string; body: string; link: string; button: string
}) {
  const text = `Hello ${p.name},\n\n${p.body}\n\n${p.button}: ${p.link}\n\nYou can turn these emails off in Settings.`
  const html = layout(
    esc(p.heading),
    `Hello ${esc(p.name)},\n\n${esc(p.body)}`,
    p.link,
    esc(p.button),
    'You receive this because email notifications are on. You can turn them off in Settings.'
  )
  return send(p.to, p.subject, text, html)
}

// ---------------------------------------------------------------------------------------------
// Bilingual (English + Urdu) emails for the subscription and reminder flows.
// Pakistan's lawyers read both, so every message carries both languages, English first.
// ---------------------------------------------------------------------------------------------
type Lang = { heading: string; body: string; button: string }

function layoutBilingual(en: Lang, ur: Lang, link: string) {
  const block = (l: Lang, dir: 'ltr' | 'rtl') => `<div dir="${dir}" style="text-align:${dir === 'rtl' ? 'right' : 'left'}">
  <h2 style="margin:0 0 12px">${esc(l.heading)}</h2>
  <p style="line-height:1.7;white-space:pre-line;margin:0">${esc(l.body)}</p>
  <p style="margin:18px 0"><a href="${esc(link)}" style="background:#c5a880;color:#0f172a;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;display:inline-block">${esc(l.button)}</a></p>
</div>`
  return `<div style="font-family:Arial,'Noto Naskh Arabic',Tahoma,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a">
  ${block(en, 'ltr')}
  <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0">
  ${block(ur, 'rtl')}
  <p style="font-size:12px;color:#64748b;line-height:1.5;margin-top:20px" dir="ltr">${esc(link)}</p>
</div>`
}

function sendBilingual(to: string, subject: string, en: Lang, ur: Lang, link: string) {
  const text = `${en.heading}\n\n${en.body}\n\n${en.button}: ${link}\n\n-----\n\n${ur.heading}\n\n${ur.body}\n\n${ur.button}: ${link}`
  return send(to, subject, text, layoutBilingual(en, ur, link))
}

export type SubscriptionReminderKind = 'trial3' | 'trial1' | 'period5' | 'past_due' | 'suspended'

export function sendSubscriptionReminderEmail(p: {
  to: string; name: string; kind: SubscriptionReminderKind; link: string; graceDays?: number
}) {
  const g = p.graceDays ?? 5
  const copy: Record<SubscriptionReminderKind, { subject: string; en: Lang; ur: Lang }> = {
    trial3: {
      subject: `Your ${BRAND.name} trial ends in 3 days`,
      en: { heading: 'Your free trial ends in 3 days', body: `Hello ${p.name},\n\nYour ${BRAND.name} free trial ends in 3 days. Choose a plan and send your bank transfer details to keep your workspace running.`, button: 'Choose a plan' },
      ur: { heading: 'آپ کا مفت ٹرائل 3 دن میں ختم ہو رہا ہے', body: `محترم ${p.name}،\n\nآپ کا ${BRAND.name} کا مفت ٹرائل 3 دن میں ختم ہو جائے گا۔ اپنا ورک اسپیس جاری رکھنے کے لیے پلان منتخب کریں اور بینک ٹرانسفر کی تفصیل بھیجیں۔`, button: 'پلان منتخب کریں' },
    },
    trial1: {
      subject: `Your ${BRAND.name} trial ends tomorrow`,
      en: { heading: 'Your free trial ends tomorrow', body: `Hello ${p.name},\n\nYour ${BRAND.name} free trial ends tomorrow. Choose a plan today so there is no interruption.`, button: 'Choose a plan' },
      ur: { heading: 'آپ کا مفت ٹرائل کل ختم ہو رہا ہے', body: `محترم ${p.name}،\n\nآپ کا ${BRAND.name} کا مفت ٹرائل کل ختم ہو جائے گا۔ رکاوٹ سے بچنے کے لیے آج ہی پلان منتخب کریں۔`, button: 'پلان منتخب کریں' },
    },
    period5: {
      subject: `Your ${BRAND.name} subscription renews soon`,
      en: { heading: 'Your subscription ends in 5 days', body: `Hello ${p.name},\n\nYour current ${BRAND.name} period ends in 5 days. Send your next bank transfer and upload the receipt to renew.`, button: 'Renew now' },
      ur: { heading: 'آپ کی سبسکرپشن 5 دن میں ختم ہو رہی ہے', body: `محترم ${p.name}،\n\nآپ کی موجودہ ${BRAND.name} مدت 5 دن میں ختم ہو جائے گی۔ تجدید کے لیے اگلی بینک ٹرانسفر کریں اور رسید اپ لوڈ کریں۔`, button: 'ابھی تجدید کریں' },
    },
    past_due: {
      subject: `Payment overdue: ${BRAND.name}`,
      en: { heading: 'Your subscription payment is overdue', body: `Hello ${p.name},\n\nYour ${BRAND.name} subscription has expired. Your workspace keeps working for a short grace period (${g} days in total), after which it is paused. Renew now to avoid interruption. Your data stays safe either way.`, button: 'Renew now' },
      ur: { heading: 'آپ کی سبسکرپشن کی ادائیگی کی مدت گزر چکی ہے', body: `محترم ${p.name}،\n\nآپ کی ${BRAND.name} سبسکرپشن ختم ہو چکی ہے۔ کچھ مہلت (کل ${g} دن) تک ورک اسپیس چلتا رہے گا، اس کے بعد بند ہو جائے گا۔ رکاوٹ سے بچنے کے لیے ابھی تجدید کریں۔ آپ کا ڈیٹا ہر صورت محفوظ رہتا ہے۔`, button: 'ابھی تجدید کریں' },
    },
    suspended: {
      subject: `Your ${BRAND.name} workspace is paused`,
      en: { heading: 'Your workspace is paused', body: `Hello ${p.name},\n\nYour ${BRAND.name} subscription is no longer active, so your workspace (and your juniors and clients) are paused. Nothing has been deleted. Renew and everything is available again as soon as your payment is confirmed.`, button: 'Renew subscription' },
      ur: { heading: 'آپ کا ورک اسپیس روک دیا گیا ہے', body: `محترم ${p.name}،\n\nآپ کی ${BRAND.name} سبسکرپشن فعال نہیں رہی، اس لیے آپ کا ورک اسپیس (اور آپ کے جونیئرز اور کلائنٹس) روک دیے گئے ہیں۔ کچھ بھی حذف نہیں ہوا۔ تجدید کریں، ادائیگی کی تصدیق ہوتے ہی سب کچھ دوبارہ دستیاب ہو جائے گا۔`, button: 'سبسکرپشن کی تجدید کریں' },
    },
  }
  const c = copy[p.kind]
  return sendBilingual(p.to, c.subject, c.en, c.ur, p.link)
}

export function sendPaymentResultEmail(p: {
  to: string; name: string; confirmed: boolean; plan: string; months: number; endsOn?: string; note?: string | null; link: string
}) {
  const monthsEn = `${p.months} month${p.months === 1 ? '' : 's'}`
  if (p.confirmed) {
    return sendBilingual(
      p.to,
      `Payment confirmed: ${BRAND.name}`,
      { heading: 'Payment confirmed. Thank you!', body: `Hello ${p.name},\n\nWe received your bank transfer for the ${p.plan} plan (${monthsEn}).${p.endsOn ? ` Your subscription now runs until ${p.endsOn}.` : ''}`, button: 'Open my workspace' },
      { heading: 'ادائیگی کی تصدیق ہو گئی۔ شکریہ!', body: `محترم ${p.name}،\n\nہمیں ${p.plan} پلان (${p.months} ماہ) کی بینک ٹرانسفر موصول ہو گئی ہے۔${p.endsOn ? ` آپ کی سبسکرپشن اب ${p.endsOn} تک چلے گی۔` : ''}`, button: 'میرا ورک اسپیس کھولیں' },
      p.link
    )
  }
  return sendBilingual(
    p.to,
    `Payment could not be confirmed: ${BRAND.name}`,
    { heading: 'We could not confirm your payment', body: `Hello ${p.name},\n\nWe could not match your bank transfer for the ${p.plan} plan (${monthsEn}).${p.note ? `\n\nReason: ${p.note}` : ''}\n\nPlease check the details and submit it again, or contact us.`, button: 'Open subscription' },
    { heading: 'ہم آپ کی ادائیگی کی تصدیق نہیں کر سکے', body: `محترم ${p.name}،\n\nہم ${p.plan} پلان (${p.months} ماہ) کی آپ کی بینک ٹرانسفر کو مماثل نہیں کر سکے۔${p.note ? `\n\nوجہ: ${p.note}` : ''}\n\nبراہِ کرم تفصیل چیک کر کے دوبارہ جمع کروائیں یا ہم سے رابطہ کریں۔`, button: 'سبسکرپشن کھولیں' },
    p.link
  )
}

// One digest per person: upcoming hearings, meetings, deadlines and due tasks.
// Each line carries an English and an Urdu text. Contains titles only, never case details.
export function sendReminderDigestEmail(p: {
  to: string; name: string; lines: { en: string; ur: string }[]; link: string
}) {
  const n = p.lines.length
  return sendBilingual(
    p.to,
    `Reminder: ${n} upcoming item${n === 1 ? '' : 's'} / ${n} یاد دہانی`,
    { heading: 'Coming up tomorrow', body: `Hello ${p.name},\n\n${p.lines.map((l) => `• ${l.en}`).join('\n')}`, button: 'Open my dashboard' },
    { heading: 'کل کے لیے یاد دہانی', body: `محترم ${p.name}،\n\n${p.lines.map((l) => `• ${l.ur}`).join('\n')}`, button: 'میرا ڈیش بورڈ کھولیں' },
    p.link
  )
}
