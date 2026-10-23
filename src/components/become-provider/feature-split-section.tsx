import { AppImage } from "@/components/ui/app-image";
import { HighlightTag } from "@/components/become-provider/highlight-tag";
import type { FeatureApi } from "@/lib/become-provider";
import { translated, translatedDescription, translatedHeadline } from "@/lib/become-provider";

export function FeatureSplitSection({ feature }: { feature: FeatureApi }) {
  const isReversed = feature.position === "right";
  const headline = translatedHeadline(feature);

  return (
    <section className="relative">
      <div className="container mx-auto px-4 py-8 md:py-20">
        <div
          className={`flex flex-col items-center gap-8 md:flex-row ${
            isReversed ? "md:flex-row-reverse" : ""
          }`}
        >
          <div className="flex flex-col items-start justify-center gap-4 text-left md:w-1/2">
            {headline && <HighlightTag text={headline} />}
            <h2 className="text-2xl font-bold text-text-primary md:text-4xl">{translated(feature)}</h2>
            <p className="text-sm font-normal text-text-secondary md:text-lg">
              {translatedDescription(feature)}
            </p>
          </div>

          <div className="flex w-full items-center justify-center md:w-1/2">
            {/* Capped to the source image's native 645x645 — stretching wider than that upscales and blurs it. */}
            <div className="aspect-square w-full max-w-161.25">
              <AppImage
                src={feature.image}
                alt={translated(feature)}
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
