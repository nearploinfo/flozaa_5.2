"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataFoundState } from "@/components/ui/no-data-found-state";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons/icons";
import { MobileBookingCard } from "@/components/bookings/mobile-booking-card";
import { toBookingCardData, type BookingBucketsApi } from "@/lib/orders-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

function MobileBookingGroup({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex w-full flex-col items-start gap-2 px-4">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="text-base font-medium text-text-primary">{title}</span>
        {expanded ? (
          <ChevronUpIcon className="size-4 text-icon-primary" />
        ) : (
          <ChevronDownIcon className="size-4 text-icon-primary" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Mobile-only bucket layout — ongoing is a horizontal-scroll strip of
 * compact cards, upcoming/completed/cancelled are vertical lists with
 * invoice number + price/date/time; "Re Book" only shows on completed.
 * Each group collapses independently, same as desktop's booking-section.tsx.
 * Desktop keeps booking-buckets-sections.tsx unchanged. */
export function MobileBookingBucketsSections({
  buckets,
  status,
}: {
  buckets: BookingBucketsApi;
  status: "loading" | "loaded" | "error";
}) {
  const { t } = useTranslation();

  if (status === "loading") {
    return (
      <div className="flex w-full flex-col gap-4 px-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl bg-bg-tertiary" />
        ))}
      </div>
    );
  }

  const ongoing = buckets.ongoing_bookings.map(toBookingCardData);
  const upcoming = buckets.upcoming_bookings.map(toBookingCardData);
  const completed = buckets.completed_bookings.map(toBookingCardData);
  const cancelled = buckets.cancelled_bookings.map(toBookingCardData);
  const hasAny = ongoing.length + upcoming.length + completed.length + cancelled.length > 0;

  if (!hasAny) {
    return (
      <NoDataFoundState
        title={t("bookings.emptyTitle")}
        description={t("bookings.emptyDescription")}
        className="w-full"
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-4 py-2">
      {ongoing.length > 0 && (
        <MobileBookingGroup title={t("bookings.ongoing")}>
          <div className="no-scrollbar flex w-full items-stretch gap-3 overflow-x-auto">
            {ongoing.map((booking) => (
              <MobileBookingCard key={booking.id} booking={booking} compact />
            ))}
          </div>
        </MobileBookingGroup>
      )}

      {upcoming.length > 0 && (
        <MobileBookingGroup title={t("bookings.upcoming")}>
          <div className="grid w-full grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            {upcoming.map((booking) => (
              <MobileBookingCard key={booking.id} booking={booking} showInvoiceNumber />
            ))}
          </div>
        </MobileBookingGroup>
      )}

      {completed.length > 0 && (
        <MobileBookingGroup title={t("bookings.completed")}>
          <div className="grid w-full grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            {completed.map((booking) => (
              <MobileBookingCard key={booking.id} booking={booking} showInvoiceNumber showRebook />
            ))}
          </div>
        </MobileBookingGroup>
      )}

      {cancelled.length > 0 && (
        <MobileBookingGroup title={t("bookings.cancelled")}>
          <div className="grid w-full grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            {cancelled.map((booking) => (
              <MobileBookingCard key={booking.id} booking={booking} showInvoiceNumber />
            ))}
          </div>
        </MobileBookingGroup>
      )}
    </div>
  );
}
