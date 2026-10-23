"use client";

import { Calendar } from "lucide-react";
import { useRouter } from "next/router";
import { Link } from "@/components/ui/locale-link";
import { AppButton } from "@/components/ui/app-button";
import { ClockIcon, ChatIcon } from "@/components/icons/icons";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import type { BookingCardData } from "@/lib/orders-catalog";
import { buildChatHref } from "@/lib/chats/chat-types";
import { useDateTimeFormatter } from "@/lib/use-date-time-formatter";

export function RequestedBookingCard({ booking }: { booking: BookingCardData }) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const showPrice = usePriceFormatter();
  const { formatBookingDate, formatBookingTime } = useDateTimeFormatter();
  const bookingHref = localizePath(`/booking/${booking.id}`, lang, defaultLocale);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(bookingHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(bookingHref);
        }
      }}
      className="flex w-full cursor-pointer flex-col items-start gap-6 overflow-hidden rounded-lg border border-border-default bg-bg-primary p-4"
    >
      <div className="flex w-full items-center justify-between">
        <span className="rounded-lg bg-bg-brand-subtle px-3 py-2 text-sm text-text-brand">
          {t("bookings.card.invoiceNo", { number: booking.id })}
        </span>
        <span className="text-lg font-medium text-text-primary">{showPrice(
            booking.total,
            booking.currencySymbol
              ? { symbol: booking.currencySymbol, decimalPlaces: booking.currencyDecimalPlaces }
              : undefined
          )}</span>
      </div>

      <div className="dashed-divider" />

      <div className="flex w-full flex-col items-start gap-3">
        <div className="flex w-full items-center gap-4">
          <span className="flex-1 text-base font-medium text-text-primary">{booking.title}</span>
          <BookingStatusBadge statusKey={booking.statusKey} fallbackLabel={booking.rawStatusLabel} />
        </div>
        <div className="flex w-full items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border border-border-default bg-bg-secondary p-1">
              <Calendar className="size-5 text-icon-primary opacity-75" />
            </span>
            <span className="text-base text-text-primary">{formatBookingDate(booking.dateOfService)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border border-border-default bg-bg-secondary p-1">
              <ClockIcon className="size-5 text-icon-primary opacity-75" />
            </span>
            <span className="text-base text-text-primary">{formatBookingTime(booking.startingTime, booking.dateOfService)}</span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center gap-2.5 rounded-lg border border-border-default bg-bg-secondary p-3">
        <div className="flex flex-1 items-center gap-1">
          <span className="text-base text-text-primary">{t("bookings.card.providerLabel")}</span>
          <span className="flex-1 text-base text-text-primary">{booking.companyName}</span>
        </div>
        <AppButton asChild variant="secondary-outline" size="md">
          <Link href={bookingHref}>{t("bookings.card.viewDetails")}</Link>
        </AppButton>
        {booking.chatAllowed && (
          <AppButton
            asChild
            variant="secondary"
            size="md"
            iconOnly
            aria-label={t("common.chat")}
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href={buildChatHref(
                {
                  partnerId: booking.providerId,
                  bookingId: booking.id,
                  name: booking.companyName,
                  image: booking.image,
                  status: booking.rawStatusLabel,
                  title: booking.title,
                  extraCount: booking.extraCount,
                  date: booking.dateOfService,
                  time: booking.startingTime,
                },
                lang,
                defaultLocale
              )}
            >
              <ChatIcon className="size-6 text-button-secondary-text" />
              <span className="sr-only">{t("common.chat")}</span>
            </Link>
          </AppButton>
        )}
      </div>
    </div>
  );
}
