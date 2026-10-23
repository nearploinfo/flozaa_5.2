"use client";

import { BOOKING_STATUS_META, type BookingStatusKey } from "@/lib/helpers";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

const STATUS_FILTER_OPTIONS: BookingStatusKey[] = [
  "awaiting",
  "confirmed",
  "onTheWay",
  "arrived",
  "started",
  "cancelled",
  "rescheduled",
  "completed",
  "bookingEnded",
];

/** Mobile-only horizontal-scroll status chips — replaces the desktop
 * sort-by Dropdown, same statusFilter/setStatusFilter from useBookingBuckets. */
export function MobileStatusFilterChips({
  value,
  onChange,
}: {
  value: BookingStatusKey | "all";
  onChange: (value: BookingStatusKey | "all") => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto xl:hidden">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "shrink-0 rounded-xl px-3 py-2 text-sm",
          value === "all" ? "border border-border-brand bg-bg-brand-subtle text-text-brand" : "bg-bg-secondary text-text-primary"
        )}
      >
        {t("bookings.sortAll")}
      </button>
      {STATUS_FILTER_OPTIONS.map((key) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm",
              active ? "border border-border-brand bg-bg-brand-subtle text-text-brand" : "bg-bg-secondary text-text-primary"
            )}
          >
            {BOOKING_STATUS_META[key].label}
          </button>
        );
      })}
    </div>
  );
}
