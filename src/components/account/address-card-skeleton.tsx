import { Skeleton } from "@/components/ui/skeleton";

export function AddressCardSkeleton() {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-border-default bg-bg-primary p-4">
      <Skeleton className="h-52 w-full rounded-lg" />
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col items-start gap-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Skeleton className="h-8 w-16 rounded-sm" />
            <Skeleton className="size-8 rounded-sm" />
          </div>
        </div>

        <div className="dashed-divider" />

        <div className="flex w-full flex-col items-start gap-3">
          <Skeleton className="h-4 w-full max-w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
