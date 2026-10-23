"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { MaintenanceModeIllustration } from "@/components/common/maintenance-mode-illustration";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppSelector } from "@/store/hooks";
import { logClarityEvent } from "@/lib/analytics/clarity-events";
import { MISC_EVENTS } from "@/lib/analytics/clarity-event-names";

interface MaintenanceWebSettings {
  customer_web_maintenance_mode?: number | string;
  customer_web_maintenance_mode_start_datetime?: string;
  customer_web_maintenance_mode_end_datetime?: string;
  translated_message_for_customer_web?: string;
  message_for_customer_web?: string;
}

// Backend sends naive "YYYY-MM-DD HH:mm:ss" (no "T"/offset) UTC timestamps —
// parsed as UTC explicitly rather than the local time `new Date` would
// otherwise assume, matching the convention in lib/helpers.ts.
function parseUtcDate(input: string): Date {
  return input.includes(" ") && !input.includes("T")
    ? new Date(`${input.replace(" ", "T")}Z`)
    : new Date(input);
}

function formatRangeDate(input: string): string {
  const date = parseUtcDate(input);
  return Number.isNaN(date.getTime()) ? "" : format(date, "d MMM, yyyy - h:mm a");
}

export function useMaintenanceMode(): boolean {
  const webSettings = useAppSelector(
    (state) => state.settings.data?.web_settings
  ) as MaintenanceWebSettings | undefined;

  return webSettings?.customer_web_maintenance_mode === 1 || webSettings?.customer_web_maintenance_mode === "1";
}

export function MaintenanceMode() {
  const { t } = useTranslation();
  const webSettings = useAppSelector(
    (state) => state.settings.data?.web_settings
  ) as MaintenanceWebSettings | undefined;

  const startDateTime = webSettings?.customer_web_maintenance_mode_start_datetime;
  const endDateTime = webSettings?.customer_web_maintenance_mode_end_datetime;
  const message = webSettings?.translated_message_for_customer_web || webSettings?.message_for_customer_web;

  useEffect(() => {
    logClarityEvent(MISC_EVENTS.MAINTENANCE_MODE_VIEWED);
  }, []);

  return (
    <div className="self-stretch min-h-[679px] px-6 py-16 lg:px-36 bg-bg-primary flex flex-col justify-center items-center gap-10">
      <MaintenanceModeIllustration className="h-auto w-64 lg:w-72" />

      <div className="self-stretch flex flex-col justify-center items-center gap-3">
        <h1 className="text-center text-text-primary text-2xl lg:text-3xl font-medium leading-9">
          {t("maintenanceMode.title")}
        </h1>
        {startDateTime && endDateTime && (
          <p className="text-center text-text-primary text-lg lg:text-xl font-normal leading-7">
            {formatRangeDate(startDateTime)} {t("maintenanceMode.dateRangeSeparator")} {formatRangeDate(endDateTime)}
          </p>
        )}
        {message && (
          <p className="text-center text-text-secondary text-lg lg:text-xl font-normal leading-7">{message}</p>
        )}
      </div>
    </div>
  );
}
