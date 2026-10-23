"use client";

import { useResolvedCountrySettings } from "@/lib/show-price";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { formatBookingDate, formatBookingTime } from "@/lib/orders-catalog";
import { formatDateTime as formatIsoDateTime } from "@/lib/helpers";
import { toDateFnsDatePattern, toDateFnsTimePattern } from "@/lib/date-format-tokens";

/**
 * Resolves the customer's country date_format/time_format (v5.2.0,
 * get_country_settings) into formatter functions for booking dates/times
 * and ISO transaction/request timestamps — so transaction history, custom
 * job requests, booking chat, and the booking list/detail screens all
 * render dates in the admin-configured format instead of a hardcoded one.
 * Same hydration guard as useShowPrice: the raw hardcoded format is used
 * until the client has hydrated, so the first client render matches SSR.
 */
export function useDateTimeFormatter() {
  const hasHydrated = useHasHydrated();
  const countrySettings = useResolvedCountrySettings();
  const dateFormat = hasHydrated ? countrySettings.date_format : undefined;
  const timeFormat = hasHydrated ? countrySettings.time_format : undefined;

  const datePattern = toDateFnsDatePattern(dateFormat, "dd/MM/yyyy");
  const timePatternInfo = toDateFnsTimePattern(timeFormat, { pattern: "hh:mm a", lowercaseMeridiem: false });

  return {
    /** "yyyy-MM-dd" booking date -> localized display, e.g. booking list/detail, chat header. */
    formatBookingDate: (dateString: string) => formatBookingDate(dateString, datePattern),
    /** "HH:mm:ss[Z]" booking time -> localized display. */
    formatBookingTime: (rawTime: string, dateString?: string) =>
      formatBookingTime(rawTime, dateString, timePatternInfo.pattern, timePatternInfo.lowercaseMeridiem),
    /** ISO instant -> localized "date, time" display, e.g. transaction history, custom job requests. */
    formatDateTime: (isoString: string) => formatIsoDateTime(isoString, timeFormat, dateFormat),
    /** Raw date-fns time pattern + case flag, for call sites that format a clock time
     * directly with date-fns `format` instead of going through `formatBookingTime`
     * (e.g. status-timeline timestamps). */
    timePattern: timePatternInfo.pattern,
    lowercaseMeridiem: timePatternInfo.lowercaseMeridiem,
  };
}
