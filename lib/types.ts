import type { CaseStatus, EventKind, InvoiceStatus, Priority } from './constants'

export type UserRole = 'super_admin' | 'lawyer' | 'junior' | 'client'

// lawyers and juniors share one portal (juniors just see less)
export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/admin',
  lawyer: '/lawyer',
  junior: '/lawyer',
  client: '/client',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super admin',
  lawyer: 'Lawyer',
  junior: 'Junior',
  client: 'Client',
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  lawyer_id: string | null
  is_active: boolean
  created_at: string
  // null until the person has chosen a password (i.e. still "Invited")
  password_set_at: string | null
  phone: string | null
  firm_name: string | null
  notify_email: boolean
  mfa_enabled: boolean
  terms_accepted_at: string | null
}

export type BillingState = 'ok' | 'grace' | 'locked'
export type SubStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'canceled'

// Everything the app needs to know about the signed-in person, from ONE database call.
export interface Context extends Profile {
  firm_id: string | null // the firm this person belongs to (lawyer: themselves)
  access_active: boolean
  mfa_ok: boolean
  billing: BillingState
  billing_status: SubStatus | null
  billing_ends_at: string | null
  plan: string | null
  onboarded: boolean
}

export type ActionState =
  | {
      error?: string
      success?: string
      // one-time setup link to hand to the new user
      link?: string
      // echoed back so forms can keep what was typed after an error
      fields?: Record<string, string>
    }
  | undefined

export interface CaseRow {
  id: string
  lawyer_id: string
  client_id: string
  case_number: string
  title: string
  case_type: string
  status: CaseStatus
  court: string | null
  court_case_number: string | null
  judge: string | null
  stage: string | null
  opposing_party: string | null
  description: string | null
  opened_on: string
  closed_on: string | null
  created_at: string
  updated_at: string
}

export interface MessageRow {
  id: string
  case_id: string
  author_id: string
  body: string
  created_at: string
}

export type NoteRow = MessageRow

export interface DocumentRow {
  id: string
  case_id: string
  uploaded_by: string
  name: string
  storage_path: string
  size_bytes: number
  mime_type: string | null
  visible_to_client: boolean
  created_at: string
  folder: string
  group_id: string
  version: number
  is_current: boolean
}

export interface EventRow {
  id: string
  lawyer_id: string
  case_id: string | null
  title: string
  kind: EventKind
  starts_at: string
  location: string | null
  notes: string | null
  outcome: string | null
  visible_to_client: boolean
  created_at: string
}

export interface TaskRow {
  id: string
  lawyer_id: string
  case_id: string | null
  title: string
  due_date: string | null
  priority: Priority
  done: boolean
  assigned_to: string | null
  created_at: string
}

export interface InvoiceRow {
  id: string
  lawyer_id: string
  client_id: string
  case_id: string | null
  number: string
  description: string | null
  amount_cents: number
  currency: string
  status: InvoiceStatus
  issued_on: string
  due_on: string | null
  paid_on: string | null
  created_at: string
}

export interface TimeEntryRow {
  id: string
  lawyer_id: string
  user_id: string
  case_id: string
  entry_date: string
  minutes: number
  description: string
  billable: boolean
  rate_cents: number
  invoiced_invoice_id: string | null
  created_at: string
}

export interface TemplateRow {
  id: string
  lawyer_id: string
  kind: 'letter' | 'invoice'
  name: string
  body: string
  amount_cents: number | null
  currency: string | null
  created_at: string
  updated_at: string
}

export interface FirmSettings {
  firm_id: string
  firm_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  ntn: string | null
  bank_details: string | null
  invoice_terms: string | null
  letter_footer: string | null
}

export interface FirmPrefs {
  firm_id: string
  default_currency: string
  hourly_rate_cents: number
  default_due_days: number
  onboarded_at: string | null
}

export interface SubscriptionRow {
  firm_id: string
  plan: string
  status: SubStatus
  trial_ends_at: string | null
  current_period_end: string | null
  grace_days: number
  notes: string | null
  last_reminder_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentRow {
  id: string
  firm_id: string
  plan: string
  months: number
  amount_cents: number
  currency: string
  method: string
  reference: string | null
  paid_on: string | null
  proof_path: string | null
  note: string | null
  status: 'pending' | 'confirmed' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
}

export interface PlatformSettings {
  id: number
  bank_name: string | null
  account_title: string | null
  account_number: string | null
  iban: string | null
  branch: string | null
  payment_instructions: string | null
  support_whatsapp: string | null
  support_email: string | null
  trial_days: number
  grace_days: number
}

export interface LeadRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  firm_name: string | null
  city: string | null
  message: string | null
  status: 'new' | 'contacted' | 'won' | 'lost'
  created_at: string
}
