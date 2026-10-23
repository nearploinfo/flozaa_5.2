import { SparkleStarIcon } from "@/components/icons/icons";
import type { CategoryApi } from "@/lib/become-provider";
import { useTranslation } from "@/lib/i18n/translation-context";

function repeatCountFor(length: number): number {
  if (length === 1) return 8;
  if (length === 2) return 6;
  if (length === 3) return 4;
  return 3;
}

export function CategoryMarquee({ categories }: { categories: CategoryApi[] }) {
  const { isRtl } = useTranslation();
  const repeated = Array<CategoryApi[]>(repeatCountFor(categories.length)).fill(categories).flat();

  const renderChips = (keyPrefix: string) =>
    repeated.map((category, index) => (
      <span
        className="flex shrink-0 items-center gap-6"
        key={`${keyPrefix}-${category.id}-${index}`}
      >
        <span className="text-xl leading-5 font-bold whitespace-nowrap text-white">
          {category.translated_name || category.name}
        </span>
        <SparkleStarIcon className="size-4 shrink-0 text-white" />
      </span>
    ));

  return (
    <div className="h-20 overflow-hidden bg-black">
      <div
        className={`flex h-full w-max items-center gap-6 pl-6 ${
          isRtl ? "become-provider-marquee-rtl" : "become-provider-marquee"
        }`}
      >
        {renderChips("a")}
        {renderChips("b")}
      </div>
    </div>
  );
}
