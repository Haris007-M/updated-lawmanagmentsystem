export const CASE_STATUSES = ['open', 'in_progress', 'on_hold', 'closed'] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]

// Case types. Stored in English; shown translated through the i18n keys `caseType.<value>`.
export const CASE_TYPES = [
  'Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour',
  'Tax', 'Banking', 'Constitutional', 'Intellectual property', 'Other',
] as const

export const EVENT_KINDS = ['hearing', 'meeting', 'deadline', 'other'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'void'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const PRIORITIES = ['low', 'medium', 'high'] as const
export type Priority = (typeof PRIORITIES)[number]

export const CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR'] as const

// Suggested document folders (people can also type their own)
export const DOCUMENT_FOLDERS = [
  'General', 'Pleadings', 'Evidence', 'Court orders', 'Correspondence', 'Contracts', 'ID & authority', 'Billing',
] as const

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // matches the storage bucket limit in schema.sql
export const BUCKET = 'case-documents'
export const PROOF_BUCKET = 'payment-proofs'
export const MAX_PROOF_BYTES = 5 * 1024 * 1024

// extension -> content type. Anything not listed is rejected.
export const ALLOWED_FILES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}
export const PROOF_FILES = ['pdf', 'png', 'jpg', 'jpeg', 'webp']

export const PAGE_SIZE = 20
