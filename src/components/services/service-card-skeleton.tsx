import { Skeleton } from "@/components/ui/skeleton";

export function ServiceCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-default bg-bg-primary p-4 sm:flex-row">
      <Skeleton className="h-48 w-full shrink-0 rounded-lg sm:h-64 sm:w-48" />
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="mt-auto flex items-center justify-between">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  );
}
