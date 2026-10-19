// Letter / invoice templates: {{placeholders}}, built-in starters and the renderer.
export const TEMPLATE_VARS = [
  'client_name', 'client_email', 'client_phone',
  'case_number', 'case_title', 'case_type', 'court', 'court_case_number', 'judge', 'opposing_party',
  'date', 'firm_name', 'firm_address', 'firm_phone', 'lawyer_name',
] as const
export type TemplateVar = (typeof TEMPLATE_VARS)[number]

export function renderTemplate(body: string, vars: Partial<Record<TemplateVar, string>>): string {
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m, k: string) => {
    const v = vars[k as TemplateVar]
    return v === undefined ? m : v || '________'
  })
}

export interface Starter {
  id: string
  kind: 'letter' | 'invoice'
  name: string
  body: string
  amount_cents?: number
  currency?: string
}

// Starters are plain English drafts a lawyer is expected to adapt. They are NOT legal advice.
export const STARTERS: Starter[] = [
  {
    id: 'starter-engagement', kind: 'letter', name: 'Engagement letter',
    body: `{{date}}

{{client_name}}

Re: Engagement for {{case_title}} ({{case_number}})

Dear {{client_name}},

Thank you for instructing {{firm_name}} in the above matter. This letter confirms that we will act for you in connection with {{case_title}}, before {{court}}.

Our fees will be as discussed and recorded in our invoices. You agree to give us complete and accurate information and to inform us promptly of any development.

Please sign and return a copy of this letter to confirm your instructions.

Yours sincerely,

{{lawyer_name}}
{{firm_name}}`,
  },
  {
    id: 'starter-hearing', kind: 'letter', name: 'Hearing notice to client',
    body: `{{date}}

{{client_name}}

Re: {{case_title}} ({{case_number}}), {{court}}

Dear {{client_name}},

This is to remind you that your matter is fixed for hearing before {{court}}. Please contact our office to confirm the date and the documents you need to bring.

Yours sincerely,

{{lawyer_name}}
{{firm_name}}`,
  },
  {
    id: 'starter-status', kind: 'letter', name: 'Case status update',
    body: `{{date}}

{{client_name}}

Re: Status of {{case_title}} ({{case_number}})

Dear {{client_name}},

We write to update you on the progress of your matter before {{court}} (Case No. {{court_case_number}}).

[Write the update here]

Please call us if you have any questions.

Yours sincerely,

{{lawyer_name}}
{{firm_name}}`,
  },
  {
    id: 'starter-notice', kind: 'letter', name: 'Legal notice (draft)',
    body: `{{date}}

To: {{opposing_party}}

LEGAL NOTICE

Under instructions from and on behalf of my client {{client_name}}, I hereby serve you with the following notice:

1. [State the facts]
2. [State the demand and the time allowed]

If you fail to comply within the stated time, my client shall be constrained to initiate proceedings at your risk as to cost and consequences.

{{lawyer_name}}
Advocate, {{firm_name}}`,
  },
  {
    id: 'starter-fees', kind: 'invoice', name: 'Professional fees',
    body: 'Professional fees for legal services rendered in connection with {{case_title}} ({{case_number}}).',
  },
  {
    id: 'starter-appearance', kind: 'invoice', name: 'Appearance fee (per hearing)',
    body: 'Appearance fee for the hearing before {{court}} in {{case_title}} ({{case_number}}).',
  },
  {
    id: 'starter-consultation', kind: 'invoice', name: 'Consultation fee',
    body: 'Fee for legal consultation and advice.',
  },
]
