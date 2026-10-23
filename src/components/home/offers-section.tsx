import { AppImage } from "@/components/ui/app-image";
import type { Offer } from "@/lib/home-screen";

// Offer image ratios per banner count: 3 - 520x270, 2 - 795x412, 1 - 1620x490.
const WIDTH_CLASS_BY_COUNT: Record<number, string> = {
  1: "sm:w-full",
  2: "sm:w-[calc(50%-14px)]",
  3: "sm:w-[calc((100%-56px)/3)]",
};

const ASPECT_CLASS_BY_COUNT: Record<number, string> = {
  1: "aspect-[1620/490]",
  2: "aspect-[795/412]",
  3: "aspect-[520/270]",
};

export function OffersSection({ items }: { items: Offer[] }) {
  const widthClass = WIDTH_CLASS_BY_COUNT[items.length] ?? "sm:flex-1";
  const aspectClass = ASPECT_CLASS_BY_COUNT[items.length] ?? "aspect-[520/270]";

  return (
    <section className="commonPY">
      <div className="container flex flex-col items-stretch gap-7 sm:flex-row sm:items-end sm:justify-center">
        {items.map((offer) => (
          <a
            key={offer.id}
            href={offer.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`overflow-hidden rounded-xl ${aspectClass} ${widthClass}`}
          >
            <AppImage
              src={offer.image}
              alt={offer.alt}
              className={`h-full w-full object-contain ${aspectClass}`}
            />
          </a>
        ))}
      </div>
    </section>
  );
}
