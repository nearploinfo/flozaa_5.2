import { format as formatDateFns } from "date-fns";
import { siteConfig } from "@/lib/site-config";
import { toDateFnsDatePattern, toDateFnsTimePattern, applyMeridiemCase } from "@/lib/date-format-tokens";

export function formatRating(value: number | string): string {
  return Number(value).toFixed(2);
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** API sends titles/descriptions HTML-escaped (e.g. "&amp;" for "&") — decode for plain-text display. */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&apos;|&nbsp;/g, (entity) => HTML_ENTITIES[entity]);
}

/** API sends boolean-ish flags as 1/"1"; most are optional on their payload. */
export function isFlagOn(value: number | string | undefined): boolean {
  return value === 1 || value === "1";
}

/** "reviews.reviewCountOne" for count === 1, else "reviews.reviewCount". */
export function reviewCountKey(count: number): "reviews.reviewCountOne" | "reviews.reviewCount" {
  return count === 1 ? "reviews.reviewCountOne" : "reviews.reviewCount";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Canonical date display for the whole app: "12 November 2026".
 * Manually parses "YYYY-MM-DD[ HH:mm:ss]" (not `new Date(...)` +
 * `toLocaleDateString`) to avoid server/client timezone drift on that
 * format, which caused hydration mismatches elsewhere in this API
 * integration. Falls back to the raw input if it doesn't match.
 */
export function formatFullDate(input: string | null | undefined): string {
  if (!input) return "";
  const [datePart] = input.split(" ");
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  if (!year || !month || !day || !MONTH_NAMES[month - 1]) return input;
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * "11:00 AM" from the same naive "YYYY-MM-DD HH:mm:ss" strings
 * `formatFullDate` handles — read straight off the string rather than via
 * `Date`, for the same timezone-drift reason. Empty string if there's no
 * time part.
 */
export function formatTimeOfDay(input: string | null | undefined): string {
  const timePart = input?.split(" ")[1];
  return timePart ? formatClockTime(timePart) : "";
}

/**
 * "today" / "yesterday" for a naive "YYYY-MM-DD[ HH:mm:ss]" date, else null
 * (caller falls back to `formatFullDate`). Compares against the runtime's
 * clock, so only call it from client-only rendered data.
 */
export function getRelativeDayKey(input: string | null | undefined): "today" | "yesterday" | null {
  if (!input) return null;
  const [datePart] = input.split(" ");
  const now = new Date();
  const toKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (datePart === toKey(now)) return "today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return datePart === toKey(yesterday) ? "yesterday" : null;
}

/**
 * "1 February 2026, 6:05 PM" from an ISO instant (e.g. transaction
 * timestamps, which — unlike the naive "YYYY-MM-DD HH:mm:ss" strings
 * `formatFullDate` handles — come with an explicit "Z"/offset, so `Date`
 * parsing is unambiguous. Only call this from client-only rendered data
 * (not anything present in the initial SSR HTML) since the wall-clock
 * conversion still depends on the runtime's local timezone.
 *
 * Pass `dateFormat`/`timeFormat` (the country setting's raw values, e.g.
 * "YYYY-MM-DD" / "H:i") to render both portions per the customer's
 * location instead of the hardcoded "1 February 2026, 6:05 PM" display;
 * omit either for its old default.
 */
export function formatDateTime(isoString: string, timeFormat?: string, dateFormat?: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const datePart = dateFormat
    ? formatDateFns(date, toDateFnsDatePattern(dateFormat, "d MMMM yyyy"))
    : `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  if (timeFormat) {
    const { pattern, lowercaseMeridiem } = toDateFnsTimePattern(timeFormat, { pattern: "hh:mm a", lowercaseMeridiem: false });
    return `${datePart}, ${applyMeridiemCase(formatDateFns(date, pattern), lowercaseMeridiem)}`;
  }

  const hours24 = date.getHours();
  const hours = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  return `${datePart}, ${hours}:${minutes} ${period}`;
}

/**
 * "2 Weeks Ago" style label for an ISO instant. Same client-only caveat as
 * `formatDateTime` — it compares against the runtime's clock.
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const units: [label: string, seconds: number][] = [
    ["Year", 31536000],
    ["Month", 2592000],
    ["Week", 604800],
    ["Day", 86400],
    ["Hour", 3600],
    ["Minute", 60],
  ];
  for (const [label, unitSeconds] of units) {
    const value = Math.floor(seconds / unitSeconds);
    if (value >= 1) return `${value} ${label}${value > 1 ? "s" : ""} Ago`;
  }
  return "Just Now";
}

/**
 * "2 hours ago" / "about a week ago" style relative label, matching the old
 * app's `timeago`-based thresholds. Naive "YYYY-MM-DD HH:mm:ss" strings (no
 * "T") are backend UTC timestamps without an explicit offset — parsed as
 * UTC explicitly rather than the local time `new Date` would otherwise
 * assume. Anything else (already has "T"/offset) parses directly. Client-only:
 * compares against the runtime's clock.
 */
export function formatTimeAgo(
  input: string | null | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  if (!input) return "";
  const date = input.includes(" ") && !input.includes("T")
    ? new Date(`${input.replace(" ", "T")}Z`)
    : new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (seconds < 45) return t("account.notifications.timeAgo.justNow");
  if (seconds < 90) return t("account.notifications.timeAgo.aMinuteAgo");
  if (minutes < 45) return t("account.notifications.timeAgo.minutesAgo", { count: Math.round(minutes) });
  if (minutes < 90) return t("account.notifications.timeAgo.aboutAnHourAgo");
  if (hours < 24) return t("account.notifications.timeAgo.hoursAgo", { count: Math.round(hours) });
  if (hours < 48) return t("account.notifications.timeAgo.aDayAgo");
  if (days < 7) return t("account.notifications.timeAgo.daysAgo", { count: Math.round(days) });
  if (days < 14) return t("account.notifications.timeAgo.aboutAWeekAgo");
  if (days < 30) return t("account.notifications.timeAgo.weeksAgo", { count: Math.round(days / 7) });
  if (days < 60) return t("account.notifications.timeAgo.aboutAMonthAgo");
  if (days < 365) return t("account.notifications.timeAgo.monthsAgo", { count: Math.round(days / 30) });
  if (days < 730) return t("account.notifications.timeAgo.aboutAYearAgo");
  return t("account.notifications.timeAgo.yearsAgo", { count: Math.round(days / 365) });
}

function formatClockTime(time: string): string {
  const [hourStr, minuteStr] = time?.split(":") ?? [];
  const hour24 = Number(hourStr);
  if (!Number.isFinite(hour24)) return time;
  const hour = hour24 % 12 || 12;
  const period = hour24 >= 12 ? "PM" : "AM";
  return `${hour}:${minuteStr ?? "00"} ${period}`;
}

/**
 * "Today, 10:00 AM to 11:00 AM" for a provider's next available slot.
 * `date` is a naive "YYYY-MM-DD" (no timezone) compared against the
 * runtime's local calendar date — call only from client-rendered data,
 * same caveat as `formatDateTime`.
 */
/**
 * `now` is optional and must be omitted on the initial render of any
 * client component (server and client can land on different real dates,
 * e.g. across a static/ISR cache boundary) — passing it only after mount
 * avoids a hydration mismatch on the "Today"/"Tomorrow" label.
 */
export function formatNextAvailable(
  slot: { date: string; starting_time: string; ending_time: string },
  now?: Date
): string {
  const [year, month, day] = slot?.date?.split("-").map(Number) ?? [];

  let dayLabel: string;
  if (now) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(year ?? 0, (month ?? 1) - 1, day ?? 0);
    const dayDiff = Math.round((slotDate.getTime() - today.getTime()) / 86_400_000);
    if (dayDiff === 0) dayLabel = "Today";
    else if (dayDiff === 1) dayLabel = "Tomorrow";
    else dayLabel = "";
  } else {
    dayLabel = "";
  }
  if (!dayLabel) {
    dayLabel = year && month && day && MONTH_NAMES[month - 1] ? `${day} ${MONTH_NAMES[month - 1]}` : slot.date;
  }

  return `${dayLabel}, ${formatClockTime(slot.starting_time)} to ${formatClockTime(slot.ending_time)}`;
}

/**
 * Cosmetic map pin starting position: the user's saved location if they
 * have one, otherwise the brand's configured default (siteConfig.defaultMapCenter).
 * Never feed this into an API call or treat it as a real selected location —
 * it exists only so a map has a non-null center to render before geolocation
 * resolves or the user searches/drags/picks a spot.
 */
export function getDefaultLatLng(
  savedLat: number | null | undefined,
  savedLng: number | null | undefined
) {
  if (Number.isFinite(savedLat) && Number.isFinite(savedLng)) {
    return { lat: savedLat as number, lng: savedLng as number };
  }
  return siteConfig.defaultMapCenter;
}

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const STATUS_TEXT_CLASS: Record<StatusTone, string> = {
  success: "text-text-success",
  warning: "text-text-warning",
  error: "text-text-error",
  info: "text-text-info",
  neutral: "text-text-secondary",
};

const STATUS_BADGE_CLASS: Record<StatusTone, { bg: string; text: string }> = {
  success: { bg: "bg-alert-success-bg", text: "text-alert-success-text" },
  warning: { bg: "bg-alert-warning-bg", text: "text-alert-warning-text" },
  error: { bg: "bg-alert-error-bg", text: "text-alert-error-text" },
  info: { bg: "bg-alert-info-bg", text: "text-alert-info-text" },
  neutral: { bg: "bg-bg-secondary", text: "text-text-secondary" },
};

/** Plain colored text for a status — no background (e.g. the booking status line in chat headers). */
export function getStatusTextClass(tone: StatusTone): string {
  return STATUS_TEXT_CLASS[tone];
}

/** Pill/badge background+text pair for a status (e.g. service request status chip). */
export function getStatusBadgeClass(tone: StatusTone): { bg: string; text: string } {
  return STATUS_BADGE_CLASS[tone];
}

/**
 * Canonical booking/job status vocabulary for the whole app — every screen
 * that shows a booking-lifecycle status (chats, general bookings, booking
 * details, service requests) reads its label+tone from here instead of
 * redefining its own status→color table.
 */
export type BookingStatusKey =
  | "awaiting"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "bookingEnded"
  | "started"
  | "onTheWay"
  | "arrived";

export const BOOKING_STATUS_META: Record<BookingStatusKey, { label: string; tone: StatusTone }> = {
  awaiting: { label: "Awaiting", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  rescheduled: { label: "Rescheduled", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "error" },
  bookingEnded: { label: "Booking Ended", tone: "neutral" },
  started: { label: "Started", tone: "info" },
  onTheWay: { label: "On The Way", tone: "info" },
  arrived: { label: "Arrived", tone: "warning" },
};

export function getBookingStatusLabel(status: BookingStatusKey): string {
  return BOOKING_STATUS_META[status].label;
}

export function getBookingStatusTextClass(status: BookingStatusKey): string {
  return getStatusTextClass(BOOKING_STATUS_META[status].tone);
}

export function getBookingStatusBadgeClass(status: BookingStatusKey): { bg: string; text: string } {
  return getStatusBadgeClass(BOOKING_STATUS_META[status].tone);
}

/**
 * Icon container/icon colors for the booking timeline (Figma-specified exact
 * colors) — distinct from `getBookingStatusBadgeClass`'s tone-based subtle
 * colors, since the timeline uses violet/indigo for reschedule/arrival that
 * don't map to any status tone.
 */
const BOOKING_TIMELINE_ICON_CLASS: Record<BookingStatusKey, { bg: string; icon: string }> = {
  awaiting: { bg: "bg-bg-brand-subtle", icon: "text-icon-brand" },
  confirmed: { bg: "bg-bg-brand-subtle", icon: "text-icon-brand" },
  rescheduled: { bg: "bg-bg-timeline-purple-subtle", icon: "text-icon-timeline-reschedule" },
  started: { bg: "bg-bg-info-subtle", icon: "text-icon-info" },
  onTheWay: { bg: "bg-bg-info-subtle", icon: "text-icon-info" },
  arrived: { bg: "bg-bg-timeline-purple-subtle", icon: "text-icon-timeline-arrived" },
  completed: { bg: "bg-bg-success-subtle", icon: "text-icon-success" },
  bookingEnded: { bg: "bg-bg-secondary", icon: "text-bg-inverse" },
  cancelled: { bg: "bg-bg-error-subtle", icon: "text-icon-error" },
};

export function getBookingTimelineIconClass(status: BookingStatusKey): { bg: string; icon: string } {
  return BOOKING_TIMELINE_ICON_CLASS[status];
}

/**
 * Solid pill background per status (Figma-specified exact colors) — used by
 * the ongoing/previous booking cards' status pill, which needs solid fills
 * rather than the subtle tone backgrounds `getBookingStatusBadgeClass` gives
 * every other status surface (alert banners, chips, etc).
 */
const BOOKING_STATUS_PILL_BG: Record<BookingStatusKey, string> = {
  awaiting: "bg-bg-warning",
  confirmed: "bg-bg-success",
  completed: "bg-bg-success",
  rescheduled: "bg-bg-info",
  cancelled: "bg-bg-error",
  bookingEnded: "bg-bg-secondary",
  started: "bg-bg-info",
  arrived: "bg-icon-timeline-arrived",
  onTheWay: "bg-[#ED3608]",
};

export function getBookingStatusPillBg(status: BookingStatusKey): string {
  return BOOKING_STATUS_PILL_BG[status];
}

export function formatDistance(value: number | string, unit: string): string {
  return `${Number(value).toFixed(2)} ${unit}`;
}

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Splits a full formatted address ("Office no 256, Timesquare Empire, Bhuj,
 * Kutch, Gujarat, India") into a short primary line and a state/district/
 * country secondary line, so UI can show "if there state/country/district"
 * as a dimmer second line instead of one long string.
 */
export function splitAddressLine(formattedAddress: string): {
  primary: string;
  secondary: string | null;
} {
  const parts = formattedAddress.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 2) {
    return { primary: formattedAddress, secondary: null };
  }
  return { primary: parts[0], secondary: parts.slice(1).join(", ") };
}

/** Strips everything but digits and a single decimal point — for price
 * inputs where the browser's `inputMode="decimal"` only hints the mobile
 * keyboard and doesn't stop a physical keyboard from typing letters. */
export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}
