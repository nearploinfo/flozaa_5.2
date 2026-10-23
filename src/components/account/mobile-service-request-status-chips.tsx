"use client";

import type { ServiceRequestStatus } from "@/lib/custom-job-requests";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

const STATUS_FILTER_OPTIONS: ServiceRequestStatus[] = ["requested", "expired", "cancelled", "booked"];

/** Mobile-only horizontal-scroll status chips — replaces the desktop
 * sort-by Select, same statusFilter/setStatusFilter as the desktop view. */
export function MobileServiceRequestStatusChips({
  value,
  onChange,
}: {
  value: ServiceRequestStatus | "all";
  onChange: (value: ServiceRequestStatus | "all") => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto xl:hidden">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "shrink-0 rounded-xl px-3 py-2 text-sm",
          value === "all"
            ? "border border-border-brand bg-bg-brand-subtle text-text-brand"
            : "bg-bg-secondary text-text-primary"
        )}
      >
        {t("serviceRequests.filterAll")}
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
              active
                ? "border border-border-brand bg-bg-brand-subtle text-text-brand"
                : "bg-bg-secondary text-text-primary"
            )}
          >
            {t(`serviceRequests.status.${key}`)}
          </button>
        );
      })}
    </div>
  );
}
