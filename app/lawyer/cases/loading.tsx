import { Bar, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <Bar className="mb-8 h-8 w-48" />
      <Bar className="mb-4 h-10 w-full max-w-sm" />
      <TableSkeleton rows={8} cols={5} />
    </div>
  )
}
