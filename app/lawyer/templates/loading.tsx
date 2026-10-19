import { Bar, CardSkeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <Bar className="mb-8 h-8 w-56" />
      <div className="mb-6"><CardSkeleton lines={3} /></div>
      <TableSkeleton rows={6} cols={3} />
    </div>
  )
}
