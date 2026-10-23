import { Skeleton } from "@/components/ui/skeleton";

export function ServiceDetailsSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="bg-bg-secondary py-12">
        <div className="container flex items-stretch gap-6">
          <div className="flex flex-1 items-start gap-6 rounded-2xl border border-border-default bg-bg-primary p-6">
            <Skeleton className="h-96 w-72 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          <Skeleton className="h-96 w-96 rounded-xl" />
        </div>
      </div>

      <div className="container flex flex-col gap-4 py-8">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
