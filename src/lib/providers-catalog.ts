import type { NextAvailableSlot } from "@/lib/home-screen";

export interface NearbyProvider {
  /** Slug — used for routing (`/provider-details/{id}`), not the numeric API id. */
  id: string;
  /** Numeric backend id — required for bookmark add/remove (`partner_id`). */
  providerId?: number;
  name: string;
  avatar: string;
  banner: string;
  serviceCount: number;
  distanceKm: number;
  rating: number;
  startingPrice: number;
  href: string;
  verified?: boolean;
  /** From API's `is_bookmarked` (1/0) — seeds the bookmark icon's initial state. */
  isBookmarked?: boolean;
  nextAvailable?: { date: string; starting_time: string; ending_time: string };
  /** Only present from the /providers listing API — used for the Map View pins. */
  lat?: number;
  lng?: number;
}

export type ProviderSortBy = "price_low_to_high" | "price_high_to_low" | "highly_rated";
export type ServiceMode = "at_store" | "at_doorstep";

export interface ProviderAvailabilityItemApi {
  id: string;
  company_name: string;
  distance: string;
}

export interface ProviderAvailabilityResponse {
  error: boolean;
  message: string;
  data: ProviderAvailabilityItemApi[];
}

export interface ProviderListItemApi {
  id: number;
  slug: string;
  company_name: string;
  latitude: number;
  longitude: number;
  average_rating: number;
  number_of_ratings: number;
  total_services: number;
  distance: number;
  starting_price: number;
  banner: string;
  profile_image: string;
  is_verified: number;
  is_bookmarked?: number;
  next_available_slot?: NextAvailableSlot;
}

export interface ProviderListResponse {
  error: boolean;
  message: string;
  data: ProviderListItemApi[];
  code: number;
  total: number;
  /** Price range across all matching providers' services — used to size the price slider. */
  service_min_price?: number;
  service_max_price?: number;
}

export interface ProviderListParams {
  latitude?: number;
  longitude?: number;
  category_id?: number[];
  category_slug?: string[];
  service_mode?: ServiceMode[];
  distance_range?: string[];
  rating_min?: number;
  price_min?: number;
  price_max?: number;
  sort_by?: ProviderSortBy;
  search?: string;
  limit?: number;
  offset?: number;
}

export function toNearbyProviderCard(item: ProviderListItemApi): NearbyProvider {
  return {
    id: String(item.id),
    providerId: item.id,
    name: item.company_name,
    avatar: item.profile_image,
    banner: item.banner,
    serviceCount: item.total_services,
    distanceKm: item.distance,
    rating: item.average_rating,
    startingPrice: item.starting_price,
    href: `/provider-details/${item.slug}`,
    verified: item.is_verified === 1,
    isBookmarked: item.is_bookmarked === 1,
    lat: item.latitude,
    lng: item.longitude,
    // getServerSideProps can't serialize an explicit `undefined` — omit the
    // key entirely rather than passing a possibly-absent field straight through.
    // The API sends `{}` (not null/omitted) when there's no upcoming slot.
    ...(item.next_available_slot?.date ? { nextAvailable: item.next_available_slot } : {}),
  };
}

export interface ProviderMapPinApi {
  id: string;
  company_name: string;
  slug: string;
  latitude: string;
  longitude: string;
  ratings: string;
  image: string;
  total_services: string;
  distance: string;
  is_verified: number;
}

export interface ProvidersOnMapResponse {
  error: boolean;
  message: string;
  data: ProviderMapPinApi[];
}

export interface ShiftApi {
  shift_number: string;
  opening_time: string;
  closing_time: string;
  is_open: string;
  on_leave: string;
}

export interface DayShiftsApi {
  is_open: string;
  shifts: ShiftApi[];
}

export type ShiftsByDayApi = Record<string, DayShiftsApi>;

export interface ProviderDetailApi {
  partner_id: number;
  slug: string;
  company_name: string;
  provider_type: "individual" | "organization";
  is_verified: number;
  is_bookmarked: number;
  profile_image: string;
  at_store: number;
  at_doorstep: number;
  total_services: number;
  number_of_orders: number;
  about: string;
  long_description: string;
  average_rating: string | number;
  number_of_ratings: number;
  rating_breakdown: Record<"5" | "4" | "3" | "2" | "1", number>;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  country_code: string;
  phone: string;
  email: string;
  shifts_by_day: ShiftsByDayApi;
  address: string;
  banner: string;
  other_images: string[];
  pre_booking_chat_allowed: number;
}

export interface ProviderDetailResponse {
  error: boolean;
  message: string;
  data: ProviderDetailApi | null;
}

export interface BusinessHourSlot {
  time: string;
  onLeave?: boolean;
  /** Day has no open shifts — `time` is the localized "Closed" placeholder. */
  closed?: boolean;
}

export interface BusinessHour {
  day: string;
  isToday?: boolean;
  slots: BusinessHourSlot[];
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number.parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(displayHour).padStart(2, "0")}:${minuteStr} ${period}`;
}

// Rotates the week so today is first, matching the provider-profile UX where
// the current day's hours are surfaced at the top of the list.
export function toBusinessHours(shiftsByDay: ShiftsByDayApi): BusinessHour[] {
  const todayIndex = new Date().getDay();
  const orderedKeys = [
    ...DAY_KEYS.slice(todayIndex),
    ...DAY_KEYS.slice(0, todayIndex),
  ];

  return orderedKeys.map((key, index) => {
    const day = shiftsByDay[key];
    const slots: BusinessHourSlot[] =
      day?.is_open === "1" && day.shifts.length > 0
        ? day.shifts.map((shift) => ({
            time: `${formatTime(shift.opening_time)} - ${formatTime(shift.closing_time)}`,
            onLeave: shift.on_leave === "1",
          }))
        : [{ time: "Closed", closed: true }];

    return {
      day: DAY_LABELS[key],
      isToday: index === 0,
      slots,
    };
  });
}

/**
 * Whether the provider is inside one of today's open shifts right now. Reads
 * the raw "HH:mm(:ss)" shift times against the runtime's local clock, so call
 * it from client-rendered UI only (same caveat as the other clock helpers).
 */
export function isProviderOpenNow(shiftsByDay: ShiftsByDayApi): boolean {
  const today = shiftsByDay[DAY_KEYS[new Date().getDay()]];
  if (!today || today.is_open !== "1") return false;

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (time: string): number | null => {
    const [hours, minutes] = time.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };

  return today.shifts.some((shift) => {
    if (shift.on_leave === "1" || shift.is_open !== "1") return false;
    const opening = toMinutes(shift.opening_time);
    const closing = toMinutes(shift.closing_time);
    if (opening === null || closing === null) return false;
    // A shift that ends past midnight wraps around the day boundary.
    return closing >= opening
      ? minutesNow >= opening && minutesNow <= closing
      : minutesNow >= opening || minutesNow <= closing;
  });
}

export function toReviewLabel(numberOfRatings: number): string {
  return `(${numberOfRatings} Reviews)`;
}

export function toJobsCompletedLabel(numberOfOrders: number): string {
  return `${numberOfOrders}+ Jobs Completed`;
}
