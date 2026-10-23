"use client";

import { useRef } from "react";
import { Link } from "@/components/ui/locale-link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";
import type { PreviousBooking } from "@/lib/home-screen";
import { PreviousBookingCard } from "@/components/home/previous-booking-card";
import { MobilePreviousBookingCard } from "@/components/home/mobile-previous-booking-card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DoubleChevronRightIcon,
} from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

import "swiper/css";
import "swiper/css/navigation";

export function PreviousBookingsSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: PreviousBooking[];
}) {
  const swiperRef = useRef<SwiperClass | null>(null);
  const { t } = useTranslation();

  return (
    <section className="commonPY">
      {/* Flat title + plain "View All" link — shared by the mobile scroll-rail
          and the tablet/desktop swiper below. Desktop swaps in its own
          richer title+description row (see xl:hidden on this one). */}
      <div className="container flex items-center gap-4 xl:hidden">
        <h2 className="flex-1 text-base font-medium text-text-primary">{title}</h2>
        <AppButton
          asChild
          variant="link"
          size="sm"
          className="h-auto shrink-0 p-0 text-sm text-button-link-primary-text hover:text-button-link-primary-text"
        >
          <Link href="/general-bookings">{t("home.previousBookings.viewAll")}</Link>
        </AppButton>
      </div>

      <div className="container hidden items-center justify-between gap-6 xl:flex">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
          <p className="text-base text-text-secondary sm:text-lg">{description}</p>
        </div>
        <AppButton
          asChild
          variant="link"
          size="sm"
          className="shrink-0 gap-2 p-0 text-base text-button-link-primary-text hover:text-button-link-primary-text"
        >
          <Link href="/general-bookings">
            <span className="hidden sm:inline">{t("home.previousBookings.viewAll")}</span>
            <DoubleChevronRightIcon className="size-4 rtl:rotate-180" />
          </Link>
        </AppButton>
      </div>

      {/* Below lg (true mobile) — horizontal-scroll compact cards, bled past
          the container's own side padding so cards can peek off-edge. */}
      <div className="container mt-3 lg:hidden">
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-px-4 px-4">
          {items.map((booking) => (
            <MobilePreviousBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </div>

      {/* From lg (tablet) up — real cards in a swiper with prev/next controls
          once there's room for them, from xl (true desktop). */}
      <div className="container mt-7 hidden flex-col items-center gap-6 lg:flex">
        <Swiper
          modules={[Navigation]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            // Breakpoints match the site's real grid tokens (lg/xl/1xl/2xl);
            // slidesPerView derived from Figma booking-card widths at each
            // tier's container width (904/1140/1200/1620).
            1024: { slidesPerView: 2.4, spaceBetween: 20 },
            1200: { slidesPerView: 2.5, spaceBetween: 24 },
            1440: { slidesPerView: 2.6, spaceBetween: 24 },
            1620: { slidesPerView: 3.6, spaceBetween: 24 },
          }}
          className="w-full"
        >
          {items.map((booking) => (
            <SwiperSlide key={booking.id}>
              <PreviousBookingCard booking={booking} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="hidden items-start gap-2 xl:flex">
          <AppButton
            variant="link"
            size="md"
            iconOnly
            leftIcon={(iconProps) => <ArrowLeftIcon {...iconProps} className="size-6 rtl:rotate-180" />}
            aria-label={t("home.previousBookings.previous")}
            onClick={() => swiperRef.current?.slidePrev()}
            className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-icon-inverse"
          >
            {t("home.previousBookings.previous")}
          </AppButton>
          <AppButton
            variant="link"
            size="md"
            iconOnly
            leftIcon={(iconProps) => <ArrowRightIcon {...iconProps} className="size-6 rtl:rotate-180" />}
            aria-label={t("home.previousBookings.next")}
            onClick={() => swiperRef.current?.slideNext()}
            className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-icon-inverse"
          >
            {t("home.previousBookings.next")}
          </AppButton>
        </div>
      </div>
    </section>
  );
}
