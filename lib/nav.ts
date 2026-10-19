import type { TKey } from '@/lib/i18n/shared'

export type NavIcon =
  | 'dashboard' | 'lawyers' | 'clients' | 'audit' | 'settings' | 'cases' | 'calendar' | 'tasks'
  | 'documents' | 'billing' | 'time' | 'templates' | 'conflicts' | 'team' | 'subscription'
  | 'causelist' | 'leads' | 'wallet' | 'search'

export interface NavItem {
  href: string
  label: TKey
  icon: NavIcon
  exact?: boolean
  // phones: shown as a tab in the bottom bar (the rest go under "More")
  primary?: boolean
  // phones: shorter label for the tab
  short?: TKey
  // desktop: a thin divider is drawn before the first item of a new section
  section?: 'main' | 'tools' | 'firm'
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'nav.dashboard', short: 'nav.home', icon: 'dashboard', exact: true, primary: true, section: 'main' },
  { href: '/admin/lawyers', label: 'nav.firms', icon: 'lawyers', primary: true, section: 'main' },
  { href: '/admin/billing', label: 'nav.adminBilling', icon: 'wallet', primary: true, section: 'main' },
  { href: '/admin/leads', label: 'nav.leads', icon: 'leads', primary: true, section: 'main' },
  { href: '/admin/clients', label: 'nav.clients', icon: 'clients', section: 'tools' },
  { href: '/admin/audit', label: 'nav.audit', icon: 'audit', section: 'tools' },
  { href: '/admin/settings', label: 'nav.settings', icon: 'settings', section: 'firm' },
]

const lawyerCore: NavItem[] = [
  { href: '/lawyer', label: 'nav.dashboard', short: 'nav.home', icon: 'dashboard', exact: true, primary: true, section: 'main' },
  { href: '/lawyer/cases', label: 'nav.cases', icon: 'cases', primary: true, section: 'main' },
  { href: '/lawyer/clients', label: 'nav.clients', icon: 'clients', primary: true, section: 'main' },
  { href: '/lawyer/cause-list', label: 'nav.causeList', icon: 'causelist', primary: true, section: 'main' },
  { href: '/lawyer/calendar', label: 'nav.calendar', icon: 'calendar', section: 'main' },
  { href: '/lawyer/tasks', label: 'nav.tasks', icon: 'tasks', section: 'main' },
  { href: '/lawyer/documents', label: 'nav.documents', icon: 'documents', section: 'main' },
  { href: '/lawyer/time', label: 'nav.time', icon: 'time', section: 'tools' },
  { href: '/lawyer/templates', label: 'nav.templates', icon: 'templates', section: 'tools' },
  { href: '/lawyer/conflicts', label: 'nav.conflicts', icon: 'conflicts', section: 'tools' },
]

// The firm owner sees everything
export const LAWYER_NAV: NavItem[] = [
  ...lawyerCore,
  { href: '/lawyer/billing', label: 'nav.billing', icon: 'billing', section: 'firm' },
  { href: '/lawyer/team', label: 'nav.team', icon: 'team', section: 'firm' },
  { href: '/lawyer/subscription', label: 'nav.subscription', icon: 'subscription', section: 'firm' },
  { href: '/lawyer/settings', label: 'nav.settings', icon: 'settings', section: 'firm' },
]

// A junior never sees billing, the team or the subscription
export const JUNIOR_NAV: NavItem[] = [
  ...lawyerCore,
  { href: '/lawyer/settings', label: 'nav.settings', icon: 'settings', section: 'firm' },
]

export const CLIENT_NAV: NavItem[] = [
  { href: '/client', label: 'nav.dashboard', short: 'nav.home', icon: 'dashboard', exact: true, primary: true, section: 'main' },
  { href: '/client/cases', label: 'nav.myCases', short: 'nav.cases', icon: 'cases', primary: true, section: 'main' },
  { href: '/client/documents', label: 'nav.documents', short: 'nav.files', icon: 'documents', primary: true, section: 'main' },
  { href: '/client/appointments', label: 'nav.appointments', short: 'nav.calendar', icon: 'calendar', primary: true, section: 'main' },
  { href: '/client/invoices', label: 'nav.invoices', icon: 'billing', section: 'main' },
  { href: '/client/settings', label: 'nav.settings', icon: 'settings', section: 'firm' },
]

// shown while a lawyer's subscription is locked: only the pages that still work
export const LOCKED_NAV: NavItem[] = [
  { href: '/lawyer/subscription', label: 'nav.subscription', icon: 'subscription', exact: true, primary: true, section: 'main' },
]
