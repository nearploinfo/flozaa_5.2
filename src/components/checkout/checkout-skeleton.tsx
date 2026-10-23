import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors CheckoutViewForCart's structure: mobile header bar + stacked
 * full-width blocks; desktop 12-col grid (8-col content + 4-col sidebar). */
export function CheckoutSkeleton() {
  return (
    <>
      <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-primary p-4 xl:hidden">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col items-start gap-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-full" />
      </div>

      <div className="flex w-full justify-center bg-bg-secondary pb-28 xl:py-16">
        <div className="flex w-full flex-col items-start gap-6 px-4 xl:container xl:grid xl:grid-cols-12 xl:items-start xl:px-0">
          <div className="flex w-full flex-col items-start gap-6 xl:col-span-8">
            <Skeleton className="h-40 w-full rounded-2xl bg-bg-tertiary" />
            <Skeleton className="h-64 w-full rounded-2xl bg-bg-tertiary" />
            <Skeleton className="h-48 w-full rounded-2xl bg-bg-tertiary" />
          </div>
          <Skeleton className="hidden h-96 w-full shrink-0 rounded-2xl bg-bg-tertiary xl:block xl:col-span-4" />
        </div>
      </div>
    </>
  );
}
