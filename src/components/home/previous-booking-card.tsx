"use client";

import { Link } from "@/components/ui/locale-link";
import { ArrowRight, Calendar, Star } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";
import { formatRating } from "@/lib/helpers";
import { useRebook } from "@/lib/checkout/use-rebook";
import type { PreviousBooking } from "@/lib/home-screen";

export function PreviousBookingCard({ booking }: { booking: PreviousBooking }) {
  const { t } = useTranslation();
  const { rebook, isRebooking } = useRebook();
  return (
    <div className="previous-booking-card flex h-full flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary">
      <div className="flex items-center gap-3 border-b border-border-default bg-bg-secondary p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-2">
          <Calendar className="size-5 text-icon-primary" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm text-text-secondary">{t("home.previousBookings.dateTime")}</span>
          <span className="flex items-end gap-1 truncate text-sm font-medium text-text-primary">
            {booking.date} - {booking.time}
          </span>
        </div>
        {booking.rating !== null && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-default bg-bg-primary p-2">
            <span className="text-sm text-text-primary">{t("home.previousBookings.yourRating")}</span>
            <Star className="size-4 fill-bg-warning text-bg-warning" />
            <span className="text-sm text-text-primary">{formatRating(booking.rating)}</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex flex-col items-start gap-2">
          <span className="line-clamp-1 text-base font-medium text-text-primary">
            {booking.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <AppImage
            src={booking.providerAvatar}
            alt={booking.providerName}
            className="size-11 shrink-0 rounded-lg object-cover"
          />
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-text-primary">{t("common.provider")}</span>
            <span className="text-sm font-medium text-text-primary">
              {booking.providerName}
            </span>
          </div>
        </div>

        <div className="dashed-divider mt-auto" />

        <div className="flex w-full items-center gap-4">
          {booking.isReorderAllowed && (
            <AppButton
              variant="secondary"
              size="md"
              className="flex-1 justify-center"
              disabled={isRebooking(booking.orderId)}
              onClick={() => rebook(booking.orderId)}
            >
              {t("home.previousBookings.bookAgain")}
            </AppButton>
          )}
          <AppButton
            asChild
            variant="secondary-outline"
            size="md"
            className="flex-1 justify-center gap-2"
          >
            <Link href={booking.providerHref}>
              {t("common.viewDetails")}
              <ArrowRight className="size-4 shrink-0 rtl:rotate-180" />
            </Link>
          </AppButton>
        </div>
      </div>
    </div>
  );
}
