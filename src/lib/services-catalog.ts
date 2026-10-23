import { decodeHtmlEntities } from "@/lib/helpers";

export interface ServiceCardData {
  /** Slug — used for routing (`/service-details/{id}`), not the numeric API id. */
  id: string;
  /** Numeric backend id — required for bookmark add/remove (`service_id`). */
  serviceId?: number;
  title: string;
  image: string;
  category: string;
  rating: number;
  persons: number;
  minutes: number;
  /** Unit for `minutes` when the source duration isn't in minutes (e.g. hours/days bookings). Defaults to minutes. */
  durationType?: "minutes" | "hours" | "days";
  price: number;
  originalPrice: number;
  discountPercent: number;
  providerName?: string;
  providerVerified?: boolean;
  /** From API's `is_bookmarked` (1/0) — seeds the bookmark icon's initial state. */
  isBookmarked?: boolean;
  /** Provider's location — only present from the /services listing API, used for the Map View pins. */
  lat?: number;
  lng?: number;
}

export type DurationType = "minutes" | "hours" | "days";

// Backend sends this capitalized ("Hours", "Days") even though every
// DURATION_TRANSLATION_KEY lookup in the app is keyed lowercase — normalize
// once at ingestion so every consumer can trust the DurationType it's typed as.
export function normalizeDurationType(raw: string | null | undefined): DurationType {
  const lower = (raw ?? "").toLowerCase();
  return lower === "hours" || lower === "days" ? lower : "minutes";
}

export interface ServiceListItemApi {
  id: number;
  provider_id: number;
  slug: string;
  title: string;
  description: string;
  image: string;
  category_id: number;
  category_name: string;
  price: number;
  discounted_price: number;
  discount_percentage: number;
  duration: number;
  duration_type: DurationType;
  number_of_members_required: number;
  max_quantity_allowed?: number;
  average_rating: number;
  number_of_ratings: number;
  company_name: string;
  latitude: number;
  longitude: number;
  is_provider_verified: number;
  is_bookmarked?: number;
}

export interface ServiceListResponse {
  error: boolean;
  message: string;
  data: ServiceListItemApi[];
  code: number;
  total: number;
  /** Price range across all services matching the current location/category/etc.
   * filters (ignoring the price filter itself) — used to size the price slider. */
  service_min_price?: number;
  service_max_price?: number;
}

export type ServiceSortBy = "price_low_to_high" | "price_high_to_low" | "highly_rated";

export interface ServiceListParams {
  latitude?: number;
  longitude?: number;
  search?: string;
  limit?: number;
  offset?: number;
  category_ids?: number[];
  category_slugs?: string[];
  duration_min?: number;
  duration_max?: number;
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  sort_by?: ServiceSortBy;
  /**
   * Filters to one provider's services. Switches get_all_services' response
   * shape from a flat ServiceListItemApi[] to ProviderServicesGroupApi[]
   * (grouped by category) — use flattenProviderServices() on the result.
   */
  provider_id?: number;
}

export interface ProviderServicesGroupApi {
  category_id: number;
  category_slug: string;
  category_name: string;
  total_services: number;
  services: ServiceListItemApi[];
}

export interface ProviderServicesGroupedResponse {
  error: boolean;
  message: string;
  data: ProviderServicesGroupApi[];
  code: number;
  total: number;
  /** Price range across this provider's services (ignoring the price filter
   * itself) — used to size the price slider, same as ServiceListResponse. */
  service_min_price?: number;
  service_max_price?: number;
}

export function flattenProviderServices(
  response: ProviderServicesGroupedResponse | null
): ServiceListItemApi[] {
  // Stamp each service with its *group's* category — a service's own
  // category_id/category_name can disagree with the group it was returned
  // under (backend data inconsistency), and the UI regroups by category
  // downstream, so the group's category is the one that must stick.
  return (response?.data ?? []).flatMap((group) =>
    group.services.map((service) => ({
      ...service,
      category_id: group.category_id,
      category_name: group.category_name,
    }))
  );
}

export interface ServiceDetailProviderApi {
  id: number;
  slug: string;
  is_verified: number;
  company_name: string;
  about: string;
  phone: string;
  country_code: string;
  email: string;
  average_rating: number;
  number_of_ratings: number;
  image: string;
  distance: number | null;
  pre_booking_chat_allowed?: number;
}

export interface ServiceDetailCategoryApi {
  id: number;
  name: string;
  slug: string;
}

export interface ServiceFaqApi {
  question: string;
  answer: string;
}

export interface ServiceDetailApi {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  number_of_members_required: number;
  duration: number;
  duration_type: DurationType;
  total_bookings: number;
  price: number;
  discounted_price: number;
  discount_percentage: number;
  image: string;
  other_images: string[];
  files: string[];
  tags?: string[];
  whats_included: string[];
  whats_excluded: string[];
  faqs: ServiceFaqApi[];
  average_rating: number;
  number_of_ratings: number;
  /** Optional 1/"1" flags; absent on older API builds. */
  pay_later?: number | string;
  at_doorstep?: number | string;
  at_store?: number | string;
  is_cancellable?: number | string;
  is_bookmarked?: number;
  provider: ServiceDetailProviderApi;
  category: ServiceDetailCategoryApi;
  related_services: ServiceListItemApi[];
}

export interface ServiceDetailResponse {
  error: boolean;
  message: string;
  data: ServiceDetailApi | null;
  code: number;
}

export interface ServiceRatingApi {
  id: string;
  user_name: string;
  profile_image: string;
  service_name: string;
  rating: string;
  comment: string;
  rated_on: string;
  images: string[];
}

export interface ServiceRatingsResponse {
  error: boolean;
  message: string;
  data: ServiceRatingApi[];
  total: string;
}

export type ServiceRatingsSort = "all" | "rating-desc" | "rating-asc" | "newest";

export interface ServiceRatingsParams {
  slug?: string;
  provider_slug: string;
  limit?: number;
  offset?: number;
  sort?: ServiceRatingsSort;
}

export function toServiceCardData(item: ServiceListItemApi): ServiceCardData {
  return {
    id: item.slug,
    serviceId: item.id,
    title: decodeHtmlEntities(item.title),
    image: item.image,
    category: item.category_name,
    rating: item.average_rating,
    persons: item.number_of_members_required,
    minutes: item.duration,
    durationType: normalizeDurationType(item.duration_type),
    price: item.discounted_price > 0 ? item.discounted_price : item.price,
    originalPrice: item.price,
    discountPercent: item.discount_percentage,
    isBookmarked: item.is_bookmarked === 1,
    providerName: item.company_name,
    providerVerified: item.is_provider_verified === 1,
    lat: item.latitude,
    lng: item.longitude,
  };
}
