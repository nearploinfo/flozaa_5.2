"use client";

import { useRef } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from "@/components/icons/icons";
import { HighlightTag } from "@/components/become-provider/highlight-tag";
import { TitleWithHighlight } from "@/components/become-provider/title-highlight";
import { ReviewCard } from "@/components/become-provider/review-card";
import { useTranslation } from "@/lib/i18n/translation-context";
import { translated, translatedDescription, translatedHeadline } from "@/lib/become-provider";
import type { ReviewSectionApi } from "@/lib/become-provider";

export function ReviewsSection({ data, totalRating }: { data: ReviewSectionApi; totalRating?: number }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const { t } = useTranslation();
  const headline = translatedHeadline(data);

  return (
    <section className="bg-bg-brand/5">
      <div className="container mx-auto py-8 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-[30px]">
          <div className="flex flex-col items-start justify-center gap-4">
            {headline && <HighlightTag text={headline} />}
            <h2 className="text-2xl font-bold text-text-primary md:text-4xl lg:text-5xl">
              <TitleWithHighlight title={translated(data)} />
            </h2>
            <p className="text-sm font-normal text-text-secondary md:text-lg">{translatedDescription(data)}</p>

            <div className="mt-4 flex w-full items-center justify-between">
              {Boolean(totalRating && totalRating > 0) && (
                <div className="flex flex-col items-start">
                  <span className="flex items-center gap-2 text-3xl leading-tight font-bold text-yellow-600 md:text-5xl">
                    <span>{totalRating}</span>
                    <StarIcon className="size-8 text-yellow-600 md:size-10" />
                  </span>
                  <span className="text-lg font-medium text-text-secondary md:text-3xl">
                    {t("becomeProviderPage.overAllRating")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="flex size-[38px] items-center justify-center rounded-full border border-border-strong"
                  aria-label="Previous"
                >
                  <ArrowLeftIcon className="size-4 rtl:rotate-180" />
                </button>
                <button
                  onClick={() => swiperRef.current?.slideNext()}
                  className="flex size-[38px] items-center justify-center rounded-full border border-border-strong"
                  aria-label="Next"
                >
                  <ArrowRightIcon className="size-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <Swiper
              spaceBetween={20}
              slidesPerView={1}
              modules={[Navigation, Autoplay]}
              autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              loop
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              className="w-full"
            >
              {data.reviews?.map((review, index) => (
                <SwiperSlide key={index}>
                  <ReviewCard review={review} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
