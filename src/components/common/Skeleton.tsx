import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-4 w-full', className)} />
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 flex-1" />
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      {/* Command box */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Details */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="rounded-lg border border-border overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex border-b border-border last:border-0">
              <Skeleton className="h-12 w-32 rounded-none" />
              <Skeleton className="h-12 flex-1 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
