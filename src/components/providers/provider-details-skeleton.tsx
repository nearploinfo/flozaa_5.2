import { Skeleton } from "@/components/ui/skeleton";

export function ProviderDetailsSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="bg-bg-secondary py-12">
        <div className="container flex items-stretch gap-6">
          <Skeleton className="h-96 w-[658px] shrink-0 rounded-xl" />
          <div className="flex flex-1 items-start gap-6 rounded-xl border border-border-default bg-bg-primary p-6">
            <div className="flex flex-1 flex-col gap-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
        </div>
      </div>

      <div className="container flex flex-col gap-4 py-8">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
