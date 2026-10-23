"use client";

import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import { ArrowUpRightIcon, SparkleStarIcon } from "@/components/icons/icons";
import { AppImage } from "@/components/ui/app-image";
import { useTranslation } from "@/lib/i18n/translation-context";
import { translated, translatedDescription, translatedHeadline, type HeroSectionApi } from "@/lib/become-provider";
import { CategoryMarquee } from "@/components/become-provider/category-marquee";
import { HighlightTag } from "@/components/become-provider/highlight-tag";
import { TitleWithHighlight } from "@/components/become-provider/title-highlight";
import type { CategoryApi } from "@/lib/become-provider";

function formatCount(value: number): string {
  if (value >= 1000) {
    const formatted = (value / 1000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}M+`;
  }
  return value.toString();
}

function StatBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`absolute z-20 flex flex-col items-start gap-2 rounded-xl border border-border-default bg-bg-primary p-4 shadow-[0px_7px_28px_2px_rgba(150,150,161,0.14)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function HeroSection({
  data,
  categories,
  totalRating,
  happyCustomers,
  onGetStarted,
}: {
  data: HeroSectionApi;
  categories?: CategoryApi[];
  totalRating?: number;
  happyCustomers?: number;
  onGetStarted: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-bg-brand/5">
      <div className="relative z-10 pt-8 pb-0 md:pt-20">
        <div className="container mx-auto flex flex-col items-center justify-between gap-14 lg:flex-row">
          <div className="flex flex-col text-center lg:text-left">
            {translatedHeadline(data) && (
              <div className="flex justify-center lg:justify-start">
                <HighlightTag text={translatedHeadline(data)} />
              </div>
            )}
            <span className="mt-4 text-3xl leading-tight font-bold text-text-primary md:mt-6 md:text-5xl lg:text-6xl lg:leading-16.75">
              <TitleWithHighlight title={translated(data)} />
            </span>
            <span className="mt-3 text-sm font-normal text-text-secondary md:text-base">
              {translatedDescription(data)}
            </span>
            <button
              type="button"
              onClick={onGetStarted}
              className="mt-4 flex w-fit items-center gap-2 rounded-full bg-bg-inverse px-4 py-3 text-base font-medium text-text-inverse-dark"
            >
              {t("becomeProviderPage.getStarted")}
              <span className="flex items-center justify-center rounded-full bg-bg-primary p-1">
                <ArrowUpRightIcon className="size-4 text-icon-primary" />
              </span>
            </button>
          </div>

          <div className="relative flex w-full shrink-0 items-center justify-center lg:w-1/2">
            <div className="relative aspect-532/590 w-full max-w-125">
              <div className="absolute inset-0 left-2.5 rounded-t-[400px] border-2 border-border-brand" />

              <div className="absolute inset-0 overflow-hidden rounded-t-[400px]">
                <Swiper
                  modules={[Autoplay, EffectFade]}
                  effect="fade"
                  autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                  speed={1500}
                  loop
                  className="size-full [&_.swiper-slide]:opacity-0 [&_.swiper-slide]:transition-opacity [&_.swiper-slide]:duration-1500 [&_.swiper-slide-active]:opacity-100"
                >
                  {data.images?.map((image, index) => (
                    <SwiperSlide key={index}>
                      <AppImage src={image.image} alt={`hero-${index}`} className="size-full object-cover" />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {Boolean(happyCustomers && happyCustomers > 0) && (
                <StatBadge className="top-8 -right-4 md:top-12 md:-right-6">
                  <span className="text-3xl leading-8 font-bold text-text-primary">
                    {formatCount(happyCustomers as number)}
                  </span>
                  <span className="text-base font-medium text-text-secondary">
                    {t("becomeProviderPage.happyCustomers")}
                  </span>
                </StatBadge>
              )}

              {Boolean(totalRating && totalRating > 0) && (
                <StatBadge className="bottom-8 -left-4 md:bottom-12 md:-left-10">
                  <span className="flex items-center gap-1">
                    <span className="text-3xl leading-8 font-bold text-text-primary">
                      {(totalRating as number).toFixed(1)}
                    </span>
                    <SparkleStarIcon className="size-5 text-text-primary" />
                  </span>
                  <span className="text-base font-medium text-text-secondary">
                    {t("becomeProviderPage.overAllRating")}
                  </span>
                </StatBadge>
              )}
            </div>
          </div>
        </div>
      </div>
      {categories && categories.length > 0 && <CategoryMarquee categories={categories} />}
    </section>
  );
}
