"use client";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons/icons";
import { SubCategoryCard, type SubCategoryCardItem } from "@/components/home/sub-category-card";
import { AppButton } from "@/components/ui/app-button";

import "swiper/css";
import "swiper/css/pagination";

export function SubCategoryCarousel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: SubCategoryCardItem[];
}) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  return (
    <section className="container flex flex-col gap-7 py-16">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-2xl font-medium text-text-primary">{title}</h1>
          <p className="text-lg text-text-secondary">{description}</p>
        </div>
        {isOverflowing && (
          <div className="flex items-start gap-2">
            <AppButton
              variant="link"
              size="md"
              iconOnly
              leftIcon={(iconProps) => <ArrowLeftIcon {...iconProps} className="size-6 rtl:rotate-180" />}
              aria-label="Previous"
              onClick={() => swiperRef.current?.slidePrev()}
              className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-bg-primary"
            >
              Previous
            </AppButton>
            <AppButton
              variant="link"
              size="md"
              iconOnly
              leftIcon={(iconProps) => <ArrowRightIcon {...iconProps} className="size-6 rtl:rotate-180" />}
              aria-label="Next"
              onClick={() => swiperRef.current?.slideNext()}
              className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-bg-primary"
            >
              Next
            </AppButton>
          </div>
        )}
      </div>

      <Swiper
        modules={[Navigation, Pagination]}
        watchOverflow
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setIsOverflowing(!swiper.isLocked);
        }}
        onLock={() => setIsOverflowing(false)}
        onUnlock={() => setIsOverflowing(true)}
        onResize={(swiper) => setIsOverflowing(!swiper.isLocked)}
        pagination={{
          clickable: true,
          renderBullet: (_index, className) =>
            `<span class="${className}"><span class="hcs-pagination-dot"></span></span>`,
        }}
        spaceBetween={24}
        slidesPerView={2}
        slidesPerGroup={2}
        breakpoints={{
          640: { slidesPerView: 3, slidesPerGroup: 3 },
          1024: { slidesPerView: 4, slidesPerGroup: 4 },
          1280: { slidesPerView: 6, slidesPerGroup: 6 },
        }}
        className="hcs-carousel w-full"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="!w-64">
            <SubCategoryCard item={item} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
