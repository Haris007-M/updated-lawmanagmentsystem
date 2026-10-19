// Subscription plans. Edit the prices and limits here, then redeploy.
// Prices are per MONTH in PKR (whole rupees). Paying for longer gets a discount (see DISCOUNT_BY_MONTHS).
export const PLAN_CURRENCY = 'PKR'

export type PlanId = 'starter' | 'professional' | 'chambers'

export interface Plan {
  id: PlanId
  name: string
  priceMonthly: number // PKR per month
  maxJuniors: number
  maxClients: number
  storageGb: number
  highlight?: boolean
}

export const PLANS: Record<PlanId, Plan> = {
  starter:      { id: 'starter',      name: 'Starter',      priceMonthly: 3000,  maxJuniors: 1, maxClients: 30,  storageGb: 5 },
  professional: { id: 'professional', name: 'Professional', priceMonthly: 6000,  maxJuniors: 3, maxClients: 150, storageGb: 20, highlight: true },
  chambers:     { id: 'chambers',     name: 'Chambers',     priceMonthly: 10000, maxJuniors: 8, maxClients: 600, storageGb: 60 },
}
export const PLAN_ORDER: PlanId[] = ['starter', 'professional', 'chambers']

// months paid -> fraction you pay (12 months = pay for 10)
export const DISCOUNT_BY_MONTHS: Record<number, number> = { 1: 1, 3: 1, 6: 0.95, 12: 10 / 12 }
export const MONTH_OPTIONS = [1, 3, 6, 12]

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) in PLANS ? (id as PlanId) : 'starter']
}

// Total price in whole PKR for `months` months of a plan.
export function planPrice(id: string, months: number): number {
  const p = getPlan(id)
  const factor = DISCOUNT_BY_MONTHS[months] ?? 1
  return Math.round(p.priceMonthly * months * factor)
}
