"use client";

import { Link } from "@/components/ui/locale-link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { NearbyProvider } from "@/lib/providers-catalog";
import { ProviderCard } from "@/components/home/provider-card";
import { AppButton } from "@/components/ui/app-button";
import {
  MOBILE_SLIDES_PER_VIEW,
  MOBILE_SLIDES_PER_VIEW_BREAKPOINT,
  MOBILE_SLIDES_SPACE_BETWEEN,
} from "@/lib/carousel-config";

import "swiper/css";
import "swiper/css/pagination";
import { DoubleChevronRightIcon } from "../icons/icons";

export function ProviderCarouselSection({
  title,
  description,
  ctaLabel,
  ctaHref,
  items,
  background,
  cardStyle = "style-2",
  highlight,
  // Breakpoints match the site's real grid tokens (lg/xl/1xl/2xl); slidesPerView
  // derived from Figma provider-card widths at each tier's container width.
  // 768 isn't a named token, but without a step there every width between
  // mobile and lg(1024) is stuck at the 1.1 phone peek.
  breakpoints = {
    768: { slidesPerView: 2.2, slidesPerGroup: 1, spaceBetween: 16 },
    1024: { slidesPerView: 2.4, slidesPerGroup: 1, spaceBetween: 20 },
    1200: { slidesPerView: 2.8, slidesPerGroup: 1, spaceBetween: 26 },
    1440: { slidesPerView: 2.9, slidesPerGroup: 1, spaceBetween: 26 },
    1620: { slidesPerView: 3.9, slidesPerGroup: 1, spaceBetween: 26 },
  },
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  items: NearbyProvider[];
  background?: string;
  cardStyle?: "style-1" | "style-2";
  /** Which metric style-2 accent-highlights above the rating/services/distance row. */
  highlight?: "distance" | "rating";
  breakpoints?: Record<number, { slidesPerView: number; slidesPerGroup: number; spaceBetween?: number }>;
}) {
  return (
    <section className={`${background ?? ""} commonPY`}>
      <div className="container flex flex-col gap-3 lg:gap-6">
        {/* Mobile header — Figma's flat title + plain "View All" link */}
        <div className="flex items-center gap-4 xl:hidden">
          <h2 className="flex-1 text-base font-medium text-text-primary">{title}</h2>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="h-auto shrink-0 p-0 text-sm text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </AppButton>
        </div>

        <div className="hidden items-end justify-between gap-4 xl:flex">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
            <p className="text-base text-text-secondary sm:text-lg">{description}</p>
          </div>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="shrink-0 gap-1 p-0 text-base text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href={ctaHref}>
              <span className="hidden sm:inline">{ctaLabel}</span>
              <DoubleChevronRightIcon className="size-4 rtl:rotate-180" />
            </Link>
          </AppButton>
        </div>

        <Swiper
          modules={[Pagination]}
          pagination={{
            clickable: true,
            renderBullet: (_index, className) =>
              `<span class="${className}"><span class="hcs-pagination-dot"></span></span>`,
          }}
          spaceBetween={MOBILE_SLIDES_SPACE_BETWEEN}
          slidesPerView={1}
          slidesPerGroup={1}
          breakpoints={{
            [MOBILE_SLIDES_PER_VIEW_BREAKPOINT]: { slidesPerView: MOBILE_SLIDES_PER_VIEW, slidesPerGroup: 1 },
            ...breakpoints,
          }}
          className="hcs-carousel w-full"
        >
          {items.map((provider) => (
            <SwiperSlide key={provider.id}>
              <ProviderCard provider={provider} style={cardStyle} highlight={highlight} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
