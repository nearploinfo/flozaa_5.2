"use client";

import { useMemo } from "react";
import { Autoplay, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/scrollbar";
import { ProviderCard } from "@/components/become-provider/provider-card";
import { SectionHeading } from "@/components/become-provider/section-heading";
import type { TopProvidersSectionApi } from "@/lib/become-provider";

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

export function TopProvidersSection({ data }: { data: TopProvidersSectionApi }) {
  const providers = useMemo(
    () =>
      (data.providers ?? []).filter(
        (provider) => Number(provider.total_rating) > 0 && (provider.services?.length ?? 0) > 0
      ),
    [data.providers]
  );

  if (providers.length === 0) return null;

  if (providers.length <= 3) {
    return (
      <section className="bg-bg-primary py-8 md:py-20">
        <div className="container mx-auto">
          <SectionHeading headline={data} />
          <div className="mt-5 flex flex-wrap items-stretch justify-center gap-5">
            {providers.map((provider) => (
              <div key={provider.id} className="w-96 shrink-0">
                <ProviderCard provider={provider} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-bg-primary py-8 md:py-20">
      <div className="container mx-auto flex flex-col items-center gap-10">
        <SectionHeading headline={data} />

        <Swiper
          spaceBetween={28}
          slidesPerView={1.15}
          breakpoints={BREAKPOINTS}
          // Swiper's scrollbar drag thumb doesn't render correctly in loop mode.
          loop={false}
          modules={[Scrollbar, Autoplay]}
          autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          scrollbar={{ el: ".top-providers-scrollbar", hide: false, draggable: true }}
          className="w-full [&_.swiper-wrapper]:items-stretch"
        >
          {providers.map((provider) => (
            <SwiperSlide key={provider.id} className="h-auto">
              <ProviderCard provider={provider} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="become-provider-steps-scrollbar top-providers-scrollbar swiper-scrollbar w-full max-w-md" />
      </div>
    </section>
  );
}
