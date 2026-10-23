"use client";

import { useRef } from "react";
import { Autoplay, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/scrollbar";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons/icons";
import { HighlightTag } from "@/components/become-provider/highlight-tag";
import { TitleWithHighlight } from "@/components/become-provider/title-highlight";
import { SubscriptionCard } from "@/components/become-provider/subscription-card";
import { translated, translatedDescription, translatedHeadline } from "@/lib/become-provider";
import type { SubscriptionSectionApi } from "@/lib/become-provider";

const NAV_THRESHOLD = 4;

// Fractional slidesPerView tuned so each slide lands close to the card's
// intrinsic 384px width at common viewport sizes — slidesPerView="auto"
// leaves Swiper's scrollbar drag-thumb sizing broken (renders an empty track).
const BREAKPOINTS = {
  0: { slidesPerView: 1.15 },
  480: { slidesPerView: 1.5 },
  640: { slidesPerView: 1.8 },
  768: { slidesPerView: 2.1 },
  1024: { slidesPerView: 2.6 },
  1280: { slidesPerView: 3.1 },
  1536: { slidesPerView: 3.6 },
};

export function SubscriptionSection({ data }: { data: SubscriptionSectionApi }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const subscriptions = data.subscriptions ?? [];
  const headline = translatedHeadline(data);
  const title = translated(data);
  const description = translatedDescription(data);
  const showNav = subscriptions.length > NAV_THRESHOLD;

  if (subscriptions.length === 0) return null;

  return (
    <section className="relative">
      <div className="bg-black">
        <div className="container mx-auto flex flex-col items-start gap-7 py-8 md:py-20 lg:flex-row lg:items-end">
          <div className="flex flex-col items-start gap-6 lg:w-1/2">
            {headline && <HighlightTag text={headline} inverse />}
            <h2 className="text-3xl leading-tight font-bold text-white md:text-5xl lg:text-6xl lg:leading-[67px]">
              <TitleWithHighlight title={title} />
            </h2>
          </div>

          <div className="flex flex-col items-start gap-8 lg:w-1/2">
            <p className="text-sm font-normal text-white md:text-base">{description}</p>
            {showNav && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="flex size-[38px] items-center justify-center rounded-full border border-white text-white"
                  aria-label="Previous"
                >
                  <ArrowLeftIcon className="size-5 rtl:rotate-180" />
                </button>
                <button
                  onClick={() => swiperRef.current?.slideNext()}
                  className="flex size-[38px] items-center justify-center rounded-full border border-white text-white"
                  aria-label="Next"
                >
                  <ArrowRightIcon className="size-5 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-bg-brand/5 pb-8 md:pb-20">
        <div className="container mx-auto">
          <div className="relative z-10 -mt-6 flex flex-col items-center gap-10 md:-mt-10">
            <Swiper
              modules={[Scrollbar, Autoplay]}
              autoplay={
                subscriptions.length > 1
                  ? { delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }
                  : false
              }
              // Swiper's scrollbar drag thumb doesn't render correctly in loop mode —
              // only loop when there's no scrollbar to show.
              loop={subscriptions.length > 1 && !showNav}
              spaceBetween={28}
              slidesPerView={1.15}
              breakpoints={BREAKPOINTS}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              scrollbar={showNav ? { el: ".subscription-scrollbar", hide: false, draggable: true } : false}
              className="w-full"
            >
              {subscriptions.map((subscription) => (
                <SwiperSlide key={subscription.id}>
                  <SubscriptionCard subscription={subscription} />
                </SwiperSlide>
              ))}
            </Swiper>

            {showNav && (
              <div className="become-provider-steps-scrollbar subscription-scrollbar swiper-scrollbar w-full max-w-md" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
