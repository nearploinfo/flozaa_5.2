import { Skeleton } from "@/components/ui/skeleton";

function SectionHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-5 w-80" />
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <section className="container flex flex-col gap-6 py-12">
      <SectionHeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}

function CarouselSkeleton() {
  return (
    <section className="py-16">
      <div className="container flex flex-col gap-6">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

function BannerSkeleton() {
  return (
    <section className="container py-16">
      <Skeleton className="h-64 w-full rounded-3xl" />
    </section>
  );
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="container py-6">
        <Skeleton className="h-64 w-full rounded-2xl sm:h-96" />
      </div>
      <CategoryGridSkeleton />
      <CarouselSkeleton />
      <BannerSkeleton />
      <CarouselSkeleton />
    </div>
  );
}
