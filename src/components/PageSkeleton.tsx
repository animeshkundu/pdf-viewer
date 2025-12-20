import { Skeleton } from './ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="space-y-4 w-full max-w-2xl">
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    </div>
  )
}

export function ThumbnailSkeleton() {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-32 w-full rounded" />
          <Skeleton className="h-4 w-12 mx-auto" />
        </div>
      ))}
    </div>
  )
}
