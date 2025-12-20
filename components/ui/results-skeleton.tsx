import Skeleton from "@/components/ui/skeleton"

export default function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

