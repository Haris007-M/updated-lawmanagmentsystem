import { Bar, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <Bar className="mb-8 h-8 w-48" />
      <TableSkeleton rows={6} cols={5} />
    </div>
  )
}
