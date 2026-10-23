"use client";

import { Link } from "@/components/ui/locale-link";
import { ArrowRight, Calendar } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import { ChatIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { getBookingStatusLabel, getBookingStatusPillBg } from "@/lib/helpers";
import type { OngoingBooking } from "@/lib/home-screen";

export function OngoingBookingCard({ booking }: { booking: OngoingBooking }) {
  const { t } = useTranslation();
  return (
    <div className="ongoing-booking-card group flex h-full flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary">
      <div className="flex items-center gap-3 border-b border-border-default bg-bg-secondary p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-2">
          <Calendar className="size-5 text-icon-primary" />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-text-secondary">{t("home.ongoingBookings.dateTime")}</span>
          <span className="flex items-end gap-1 text-sm font-medium text-text-primary">
            {booking.date} - {booking.time}
          </span>
        </div>
        <AppTag
          shape="pill"
          className={`px-3 py-1 text-sm text-text-inverse-light ${getBookingStatusPillBg(booking.status)}`}
        >
          {getBookingStatusLabel(booking.status)}
        </AppTag>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex flex-col items-start gap-2">
          <span className="line-clamp-1 text-base font-medium text-text-primary">
            {booking.title}
          </span>
          {booking.extraCount > 0 && (
            <AppTag variant="brand" shape="chip">
              {t("home.ongoingBookings.more", { count: booking.extraCount })}
            </AppTag>
          )}
        </div>

        <div className="dashed-divider mt-auto" />

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
          {booking.chatHref && (
            <AppButton
              asChild
              variant="primary-outline"
              size="md"
              iconOnly
              aria-label={t("common.chat")}
            >
              <Link href={booking.chatHref}>
                <ChatIcon className="size-5 shrink-0" />
                <span className="sr-only">{t("common.chat")}</span>
              </Link>
            </AppButton>
          )}
          <AppButton
            asChild
            variant="primary-outline"
            size="md"
            iconOnly
            aria-label={t("common.view")}
          >
            <Link href={booking.providerHref}>
              <ArrowRight className="size-5 shrink-0 rtl:rotate-180" />
              <span className="sr-only">{t("common.view")}</span>
            </Link>
          </AppButton>
        </div>
      </div>
    </div>
  );
}
