"use client";

import { Link } from "@/components/ui/locale-link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { ServiceCardData } from "@/lib/services-catalog";
import { ServiceCard } from "@/components/home/service-card";
import { AppButton } from "@/components/ui/app-button";
import {
  MOBILE_SLIDES_PER_VIEW,
  MOBILE_SLIDES_PER_VIEW_BREAKPOINT,
  MOBILE_SLIDES_SPACE_BETWEEN,
} from "@/lib/carousel-config";

import "swiper/css";
import "swiper/css/pagination";
import { DoubleChevronRightIcon } from "../icons/icons";

export function ServiceCarouselSection({
  title,
  description,
  ctaLabel,
  ctaHref,
  items,
  background,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  items: ServiceCardData[];
  background?: string;
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
          breakpoints={{
            [MOBILE_SLIDES_PER_VIEW_BREAKPOINT]: { slidesPerView: MOBILE_SLIDES_PER_VIEW },
            // 768 isn't one of the site's named tokens, but without a step
            // here every width between mobile and lg(1024) — e.g. a 768px
            // tablet in portrait — is stuck at the 1.1 phone peek.
            768: { slidesPerView: 2.2, spaceBetween: 16 },
            // Breakpoints below match the site's real grid tokens
            // (lg/xl/1xl/2xl), slidesPerView derived from Figma card widths
            // at each tier's container width (904/1140/1200/1620).
            1024: { slidesPerView: 2.4, spaceBetween: 20 },
            1200: { slidesPerView: 2.1, spaceBetween: 26 },
            1440: { slidesPerView: 2.2, spaceBetween: 26 },
            1620: { slidesPerView: 3, spaceBetween: 26 },
          }}
          className={`hcs-carousel w-full ${items?.length > 1 ? '' : `[&_.swiper-pagination]:hidden!`}`}
        >
          {items.map((service) => (
            <SwiperSlide key={service.id}>
              <ServiceCard service={service} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
