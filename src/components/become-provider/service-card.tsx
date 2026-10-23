import { AppImage } from "@/components/ui/app-image";
import type { CategoryApi } from "@/lib/become-provider";

export function ServiceCard({ category, number }: { category: CategoryApi; number: number }) {
  const title = category.translated_name || category.name;

  return (
    <div className="flex h-[110px] w-full items-center gap-3 rounded-xl bg-bg-primary px-3 sm:gap-4 sm:px-4">
      <div className="shrink-0">
        <AppImage
          src={category.category}
          alt={title}
          className="size-[60px] rounded-lg object-cover sm:size-20"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base leading-5 font-semibold text-text-primary sm:text-xl sm:leading-6 md:text-2xl md:leading-7">
          {title}
        </h2>
      </div>

      <div className="flex size-11 shrink-0 items-center justify-center sm:size-14 md:size-16">
        <span className="text-lg font-semibold text-text-secondary sm:text-xl md:text-2xl">
          {number.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
