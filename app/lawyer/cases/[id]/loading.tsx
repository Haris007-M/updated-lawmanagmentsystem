import { Bar, CardSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <Bar className="mb-3 h-4 w-24" />
      <Bar className="mb-2 h-8 w-80 max-w-full" />
      <Bar className="mb-6 h-4 w-48" />
      <Bar className="mb-6 h-9 w-full max-w-lg" />
      <div className="grid gap-6 lg:grid-cols-2"><CardSkeleton lines={6} /><CardSkeleton lines={6} /></div>
    </div>
  )
}
