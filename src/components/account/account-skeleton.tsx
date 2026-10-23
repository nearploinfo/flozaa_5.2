import { Skeleton } from "@/components/ui/skeleton";

/** Just the user card at the top of the sidebar — the only part that depends on `user`. */
export function ProfileCardSkeleton() {
  return (
    <div className="flex w-full items-center gap-4 self-stretch rounded-xl border border-border-default bg-bg-secondary p-3">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-40" />
      </div>
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-xl border border-border-default bg-bg-primary">
      <div className="flex w-full items-center border-b border-border-default p-6">
        <Skeleton className="h-7 w-32" />
      </div>

      <div className="flex w-full flex-col items-start gap-6 p-6">
        <div className="flex w-full items-center gap-4 rounded-lg border border-border-default p-3">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col items-start gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        <div className="flex w-full flex-col items-start gap-4">
          <Skeleton className="h-[66px] w-full rounded-sm" />
          <Skeleton className="h-[66px] w-full rounded-sm" />
          <Skeleton className="h-[66px] w-full rounded-sm" />
        </div>

        <div className="flex w-full flex-col items-end">
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
