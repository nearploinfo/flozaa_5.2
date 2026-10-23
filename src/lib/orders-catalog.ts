import type { BillLine } from "@/lib/cart-types";
import { format, parse } from "date-fns";
import type { BookingStatusKey } from "@/lib/helpers";
import { applyMeridiemCase } from "@/lib/date-format-tokens";

/** `datePattern` is a date-fns pattern (e.g. from `toDateFnsDatePattern`) — defaults to the
 * app's old hardcoded "dd/MM/yyyy" display when the caller doesn't have a resolved country
 * date_format yet. */
export function formatBookingDate(dateString: string, datePattern: string = "dd/MM/yyyy"): string {
  const parsed = parse(dateString, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? dateString : format(parsed, datePattern);
}

/** Booking start/end times come back as "HH:mm:ss" with a trailing "Z" — that Z is a real UTC
 * marker (verified against the API: a booking made for 09:10 AM IST comes back as "03:40:00Z"),
 * so it must be converted to the viewer's local time, not stripped and read as a literal clock
 * time. Pass the booking's own "yyyy-MM-dd" date so the UTC instant resolves unambiguously
 * (date without a matching date is combined with today's date as a best-effort fallback, which
 * is only wrong right around a UTC day boundary). `timePattern`/`lowercaseMeridiem` come from
 * `toDateFnsTimePattern` — defaults to the old hardcoded "hh:mm a" display otherwise. */
export function formatBookingTime(
  rawTime: string,
  dateString?: string,
  timePattern: string = "hh:mm a",
  lowercaseMeridiem = false
): string {
  if (rawTime.endsWith("Z")) {
    const isoDate = dateString ?? format(new Date(), "yyyy-MM-dd");
    const utcInstant = new Date(`${isoDate}T${rawTime}`);
    if (!Number.isNaN(utcInstant.getTime())) return applyMeridiemCase(format(utcInstant, timePattern), lowercaseMeridiem);
  }
  const clean = rawTime.replace(/Z$/, "");
  const parsed = parse(clean, "HH:mm:ss", new Date());
  return Number.isNaN(parsed.getTime()) ? rawTime : applyMeridiemCase(format(parsed, timePattern), lowercaseMeridiem);
}

const RAW_STATUS_TO_KEY: Record<string, BookingStatusKey> = {
  awaiting: "awaiting",
  confirmed: "confirmed",
  completed: "completed",
  rescheduled: "rescheduled",
  cancelled: "cancelled",
  canceled: "cancelled",
  booking_ended: "bookingEnded",
  bookingended: "bookingEnded",
  started: "started",
  on_the_way: "onTheWay",
  ontheway: "onTheWay",
  arrived: "arrived",
};

/** Maps the backend's raw status string to the app's canonical BookingStatusKey, or null if unrecognized. */
export function toBookingStatusKey(rawStatus: string): BookingStatusKey | null {
  return RAW_STATUS_TO_KEY[rawStatus.trim().toLowerCase()] ?? null;
}

// ---------------------------------------------------------------------------
// get_all_bookings — bucketed list (General Bookings page)
// ---------------------------------------------------------------------------

export interface BookingListProviderApi {
  provider_id: number;
  company_name: string;
  is_provider_verified: number;
  /** Field name as documented, despite reading like a typo of post_booking_chat. */
  post_booking_allowed: number;
  /** "" when the provider has no uploaded profile image — no placeholder is returned. */
  profile_image: string;
}

export interface BookingListItemApi {
  id: number;
  status: string;
  start_date: string;
  start_time: string;
  service_name: string;
  other_services_count: number;
  final_total: number;
  /** Fixed at the provider's country when the booking was made — a later
   * move/multi-country switch must not reformat past bookings' amounts. */
  currency_symbol?: string;
  currency_decimal_places?: number;
  provider: BookingListProviderApi;
}

export interface BookingBucketsApi {
  ongoing_bookings: BookingListItemApi[];
  upcoming_bookings: BookingListItemApi[];
  completed_bookings: BookingListItemApi[];
  cancelled_bookings: BookingListItemApi[];
}

export interface AllBookingsResponse {
  error: boolean;
  message: string;
  data: BookingBucketsApi;
  code: number;
}

export interface BookingCardData {
  id: number;
  providerId: number;
  title: string;
  extraCount: number;
  image: string;
  companyName: string;
  providerVerified: boolean;
  statusKey: BookingStatusKey | null;
  rawStatusLabel: string;
  dateOfService: string;
  startingTime: string;
  total: number;
  chatAllowed: boolean;
  currencySymbol?: string;
  currencyDecimalPlaces?: number;
}

export function toBookingCardData(booking: BookingListItemApi): BookingCardData {
  return {
    id: booking.id,
    providerId: booking.provider.provider_id,
    title: booking.service_name,
    extraCount: booking.other_services_count,
    image: booking.provider.profile_image,
    companyName: booking.provider.company_name,
    providerVerified: booking.provider.is_provider_verified === 1,
    statusKey: toBookingStatusKey(booking.status),
    rawStatusLabel: booking.status,
    dateOfService: booking.start_date,
    startingTime: booking.start_time,
    total: booking.final_total,
    chatAllowed: booking.provider.post_booking_allowed === 1,
    currencySymbol: booking.currency_symbol,
    currencyDecimalPlaces: booking.currency_decimal_places,
  };
}

// ---------------------------------------------------------------------------
// get_booking_details — single booking (Booking Details page)
// ---------------------------------------------------------------------------

export interface BookingDetailServiceApi {
  service_id: number;
  title: string;
  category_name: string;
  quantity: number;
  price: number;
  image: string;
  rating_id: number | null;
  rating: number | null;
  review: string | null;
  review_images: string[];
}

export interface BookingStatusTimelineEntryApi {
  status: string;
  timestamp: string;
}

export interface BookingDetailProviderApi {
  provider_id: number;
  /** Not sent by every backend version — guard before linking to provider-details. */
  slug?: string;
  company_name: string;
  profile_image: string;
  average_rating: number;
  distance: number;
  post_booking_chat: number;
  is_verified: number;
  country_code: string;
  phone: string;
  latitude: number;
  longitude: number;
  advance_booking_days: number;
}

export interface BookingDetailHandymanApi {
  id: number;
  username: string;
  profile_image: string;
  is_lead: number;
  rating_id: number | null;
  rating: number | null;
  review: string | null;
  review_images: string[];
}

export interface BookingDetailFeeApi {
  id: number;
  title: string;
  // API sends this as a numeric string (e.g. "30.00") — coerce with Number() before arithmetic.
  calculated_amount: number | string;
  /** Only a taxable fee has tax; it's added ON TOP of calculated_amount. */
  is_taxable?: number;
  tax_amount?: number;
}

export interface BookingTaxComponentApi {
  /** Display name of the tax rule, in the request language. */
  name: string;
  percentage: number;
  tax_amount: number;
}

/** One charged element: the services collapsed together, the visiting charge,
 * or one taxable fee. Same shape as the cart's `tax_breakdown`. */
export interface BookingTaxBreakdownEntryApi {
  title: string;
  base_amount: number;
  total_tax: number;
  total_with_tax: number;
  tax_type: string;
  tax_components: BookingTaxComponentApi[];
}

export interface BookingTaxApi {
  /** How the SERVICES were priced — "included" | "excluded" | "mixed". */
  tax_type: string;
  /** The WHOLE booking's tax (services + visiting charge + fees) minus the
   * promo's tax reduction. base_total already contains the services' part, so
   * this must never be added to the bill lines as-is. */
  tax_amount: number;
  /** Keyed "services" | "visiting_charges" | "fee_<id>". Absent on bookings
   * placed before rule-based tax. */
  breakdown?: Record<string, BookingTaxBreakdownEntryApi>;
}

export interface BookingAdditionalChargeApi {
  name: string;
  // API sends this as a numeric string (e.g. "6000") — coerce with Number() before arithmetic.
  charge: number | string;
}

// Shape not fully documented — read defensively with fallbacks.
export interface BookingCancellationApi {
  reason?: string;
  is_payment_failure?: boolean;
}

export interface BookingDetailApi {
  id: number;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_type: "at_store" | "at_doorstep";
  address_id: number | null;
  address: string;
  services: BookingDetailServiceApi[];
  service_status_timeline: BookingStatusTimelineEntryApi[];
  is_cancelable: number;
  next_status_available: string[];
  provider: BookingDetailProviderApi;
  assigned_handymen: BookingDetailHandymanApi[];
  total_services_count: number;
  rated_services_count: number;
  rated_handymen_count: number;
  total_handymen_count: number;
  base_total: number;
  visiting_charges: number | null;
  promo_code: string;
  promo_discount: number;
  payment_method: string;
  payment_status: string;
  tax: BookingTaxApi;
  /** Tax on the visiting charge, added on top of it. 0 for an at-store booking. */
  visiting_charges_tax?: number;
  /** Tax removed because of the promo. 0 without one. */
  promo_tax_reduction?: number;
  final_total: number;
  /** Fixed at the provider's country when the booking was made. */
  currency_symbol?: string;
  currency_decimal_places?: number;
  remarks: string;
  custom_job_request: { id: number; provider_bid_note: string; customer_job_description: string } | null;
  fees: BookingDetailFeeApi[];
  additional_charges: BookingAdditionalChargeApi[];
  additional_charges_payment_method: string;
  additional_charges_payment_status: string;
  work_started_proof: string[];
  work_completed_proof: string[];
  cancellation: BookingCancellationApi | null;
  otp: string;
  multiple_days_booking: { multiple_day_date_of_service: string; multiple_day_starting_time: string; multiple_ending_time: string }[];
  is_reorder_allowed: string;
  is_pay_later_allowed: string;
  live_tracking_started: string;
}

/** `tax.breakdown` reshaped into the array the shared TaxBreakdownList takes —
 * the cart's `tax_breakdown` has the same shape, so one renderer serves both. */
/** Reshapes a booking into the per-element bill lines BillBreakdown shows:
 * Services, Visiting Charges and one line per fee, each carrying its own tax —
 * same idea as the cart's `toBillLines`, sourced from `tax.breakdown` instead. */
export function toBookingBillLines(booking: BookingDetailApi): BillLine[] {
  const breakdown = booking.tax?.breakdown ?? {};
  const lines: BillLine[] = [];

  const services = breakdown.services;
  lines.push(
    services
      ? {
          key: "services",
          title: services.title,
          total: Number(services.total_with_tax) || 0,
          baseAmount: Number(services.base_amount) || 0,
          taxComponents: (services.tax_components ?? []).map((component) => ({
            name: component.name ?? "",
            percentage: Number(component.percentage) || 0,
            taxAmount: Number(component.tax_amount) || 0,
          })),
        }
      : { key: "services", title: "", total: Number(booking.base_total) || 0 }
  );

  const visiting = breakdown.visiting_charges;
  if (visiting) {
    lines.push({
      key: "visiting_charges",
      title: visiting.title,
      total: Number(visiting.total_with_tax) || 0,
      baseAmount: Number(visiting.base_amount) || 0,
      taxComponents: (visiting.tax_components ?? []).map((component) => ({
        name: component.name ?? "",
        percentage: Number(component.percentage) || 0,
        taxAmount: Number(component.tax_amount) || 0,
      })),
    });
  } else if (booking.visiting_charges) {
    lines.push({ key: "visiting_charges", title: "", total: Number(booking.visiting_charges) || 0 });
  }

  for (const fee of booking.fees) {
    const entry = breakdown[`fee_${fee.id}`];
    lines.push(
      entry
        ? {
            key: `fee_${fee.id}`,
            title: entry.title || fee.title,
            total: Number(entry.total_with_tax) || 0,
            baseAmount: Number(entry.base_amount) || 0,
            taxComponents: (entry.tax_components ?? []).map((component) => ({
              name: component.name ?? "",
              percentage: Number(component.percentage) || 0,
              taxAmount: Number(component.tax_amount) || 0,
            })),
          }
        : { key: `fee_${fee.id}`, title: fee.title, total: Number(fee.calculated_amount) || 0 }
    );
  }

  return lines.filter((line) => line.total !== 0);
}

/** Fee amounts only — their tax is a separate line (see bookingFeesTax). */
export function bookingFeesTotal(fees: BookingDetailFeeApi[]): number {
  return fees.reduce((sum, fee) => sum + (Number(fee.calculated_amount) || 0), 0);
}

/** Tax added on top of the taxable fees. Non-taxable fees contribute nothing. */
export function bookingFeesTax(fees: BookingDetailFeeApi[]): number {
  return fees.reduce((sum, fee) => sum + (Number(fee.tax_amount) || 0), 0);
}

export interface BookingDetailResponse {
  error: boolean;
  message: string;
  data: BookingDetailApi | null;
  code: number;
}
