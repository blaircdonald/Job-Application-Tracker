import { Skeleton } from "@/components/ui/skeleton"

function JobCardSkeletonItem() {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-8">
        <div className="flex min-w-0 flex-1 gap-4">
          <Skeleton className="size-14 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center xl:w-auto xl:gap-8">
          <div className="w-full space-y-2 sm:w-36">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-36">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function JobListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <JobCardSkeletonItem key={index} />
      ))}
    </div>
  )
}

export function JobsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <JobListSkeleton />
        <div className="space-y-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
