"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Star } from "lucide-react";
import { Link } from "@/components/ui/locale-link";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import { VerifiedBadgeIcon } from "@/components/icons/icons";
import { downloadInvoicesApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { formatRating } from "@/lib/helpers";
import { useRebook } from "@/lib/checkout/use-rebook";
import type { PreviousBooking } from "@/lib/home-screen";

export function MobilePreviousBookingCard({ booking }: { booking: PreviousBooking }) {
  const { t } = useTranslation();
  const { rebook, isRebooking } = useRebook();
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    if (downloadingInvoice) return;
    setDownloadingInvoice(true);
    try {
      const blob = await downloadInvoicesApi({ order_id: booking.orderId });
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("bookings.detail.downloadInvoiceFailed"));
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <div className="flex w-72 shrink-0 flex-col gap-4 self-stretch rounded-xl border border-border-default bg-bg-primary p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-secondary">
          <Calendar className="size-4 text-icon-primary" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-text-secondary">{t("home.previousBookings.dateTime")}</span>
          <span className="truncate text-xs font-medium text-text-primary">
            {booking.date} - {booking.time}
          </span>
        </div>
        {booking.rating !== null && (
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-bg-warning-subtle px-2 py-1.5">
            <span className="text-xs text-text-primary">{t("home.previousBookings.yourRating")}</span>
            <Star className="size-3.5 fill-icon-warning text-icon-warning" />
            <span className="text-xs text-text-primary">{formatRating(booking.rating)}</span>
          </span>
        )}
      </div>

      <div className="h-px w-full bg-border-strong" />

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col items-start gap-1">
          <span className="line-clamp-2 text-sm font-medium text-text-primary">{booking.title}</span>
          {booking.extraCount > 0 && (
            <AppTag variant="brand" shape="chip">
              {t("home.previousBookings.more", { count: booking.extraCount })}
            </AppTag>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-text-secondary">{t("common.by")}</span>
          <Link
            href={booking.providerHref}
            className="flex min-w-0 items-center gap-1 text-text-primary underline"
          >
            <span className="line-clamp-1">{booking.providerName}</span>
            <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
          </Link>
        </div>
      </div>

      <div className="flex w-full items-center gap-3">
        <AppButton
          variant="primary-outline"
          size="sm"
          className="flex-1 justify-center rounded-md"
          disabled={downloadingInvoice}
          onClick={handleDownloadInvoice}
        >
          {t("bookings.detail.getInvoice")}
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          className="flex-1 justify-center rounded-md"
          disabled={!booking.isReorderAllowed || isRebooking(booking.orderId)}
          onClick={() => rebook(booking.orderId)}
        >
          {t("home.previousBookings.reBook")}
        </AppButton>
      </div>
    </div>
  );
}
