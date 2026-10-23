"use client";

import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { ChatIcon, VerifiedBadgeIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { getBookingStatusLabel } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { OngoingBooking, OngoingBookingStatus } from "@/lib/home-screen";

const STATUS_BADGE_CLASS: Record<OngoingBookingStatus, { bg: string; text: string }> = {
  started: { bg: "bg-bg-info-subtle", text: "text-text-info" },
  arrived: { bg: "bg-violet-100", text: "text-indigo-700" },
  onTheWay: { bg: "bg-red-100", text: "text-orange-600" },
};

export function MobileOngoingBookingCard({ booking }: { booking: OngoingBooking }) {
  const { t } = useTranslation();
  const { bg, text } = STATUS_BADGE_CLASS[booking.status];

  return (
    <div className="flex h-full w-72 shrink-0 snap-start flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full items-center gap-4">
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="text-xs text-text-secondary">{t("home.ongoingBookings.dateTime")}</span>
            <span className="text-xs text-text-primary">
              {booking.date}, {booking.time}
            </span>
          </div>
          <span className={cn("shrink-0 rounded-lg px-2 py-1 text-xs font-medium", bg, text)}>
            {getBookingStatusLabel(booking.status)}
          </span>
        </div>

        <div className="flex w-full flex-col items-start gap-1">
          <span className="line-clamp-1 text-sm text-text-primary">{booking.title}</span>
          {booking.extraCount > 0 && (
            <span className="text-xs text-button-link-primary-text">
              {t("home.ongoingBookings.more", { count: booking.extraCount })}
            </span>
          )}
        </div>
      </div>

      <div className="dashed-divider mt-auto" />

      <div className="flex w-full items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <AppImage
            src={booking.providerAvatar}
            alt={booking.providerName}
            className="size-8 shrink-0 rounded-md object-cover"
          />
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="text-xs text-text-secondary">{t("common.provider")}</span>
            <span className="flex items-center gap-1">
              <span className="line-clamp-1 text-xs text-text-primary">{booking.providerName}</span>
              <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
            </span>
          </div>
        </div>
        {booking.chatHref && (
          <Link
            href={booking.chatHref}
            aria-label={t("common.chat")}
            className="flex shrink-0 items-center justify-center rounded-lg bg-sky-100 p-1"
          >
            <ChatIcon className="size-5 text-text-info" />
          </Link>
        )}
      </div>
    </div>
  );
}
