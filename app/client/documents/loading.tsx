import { TableSkeleton, Bar } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <Bar className="mb-6 h-8 w-56" />
      <TableSkeleton rows={6} cols={4} />
    </div>
  )
}
