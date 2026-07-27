import { Skeleton } from '@/components/ui/Skeleton'

interface ProductGridSkeletonProps {
  count?: number
  columns?: '2-3-4' | '1-2-3'
}

export function ProductGridSkeleton({ count = 8, columns = '2-3-4' }: ProductGridSkeletonProps) {
  const gridClass =
    columns === '1-2-3'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'

  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-vm-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
