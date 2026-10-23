import type { StatusTone } from "@/lib/helpers";

export type ServiceRequestStatus = "requested" | "booked" | "cancelled" | "expired";

export const SERVICE_REQUEST_STATUS_TONE: Record<ServiceRequestStatus, StatusTone> = {
  requested: "warning",
  booked: "success",
  cancelled: "error",
  expired: "error",
};

/** "Expiry" doesn't fit the shared warning/error/success token palette — Figma
 * calls for this exact red-100/orange-600 pairing instead of an alert token. */
export const EXPIRED_BADGE_CLASS = { bg: "bg-red-100", text: "text-orange-600" };

export interface CustomJobBidderApi {
  provider_image: string;
}

export interface CustomJobRequestApi {
  id: string;
  category_id: string;
  service_title: string;
  service_short_description: string;
  min_price: string;
  max_price: string;
  requested_start_date: string;
  requested_start_time: string;
  requested_end_date: string;
  requested_end_time: string;
  created_at: string;
  status: string;
  files: string[];
  category_name: string;
  category_image: string;
  translated_status: string;
  translated_category_name: string;
  cancel_reason: string | null;
  total_bids: number;
  bidders: CustomJobBidderApi[];
}

export interface CustomJobRequestListResponse {
  error: boolean;
  message: string;
  data: CustomJobRequestApi[];
  total: string;
}

/** Backend sends "pending" while the UI's status vocabulary calls that stage "requested". */
export function toServiceRequestStatus(rawStatus: string): ServiceRequestStatus {
  const value = rawStatus.trim().toLowerCase();
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "booked") return "booked";
  if (value === "expiry" || value === "expired") return "expired";
  return "requested";
}

/** Inverse of toServiceRequestStatus — for the get_custom_job_requests `status` filter param. */
export function toRawCustomJobStatus(status: ServiceRequestStatus): string {
  if (status === "expired") return "expiry";
  if (status === "requested") return "pending";
  return status;
}

// ---------------------------------------------------------------------------
// get_custom_job_requests — slim list for the request-list screen
// ---------------------------------------------------------------------------

export interface CustomJobRequestSummaryBidderApi {
  id: number;
  profile_image: string;
}

export interface CustomJobRequestSummaryApi {
  id: number;
  title: string;
  description: string;
  category_name: string;
  min_price: number;
  max_price: number;
  /** This request's own currency — may differ from the viewer's current
   * location, so the price range must format with this, not the global one. */
  currency_symbol: string;
  currency_decimal_places: number;
  status: string;
  total_bids: number;
  bidders: CustomJobRequestSummaryBidderApi[];
}

export interface CustomJobRequestSummaryListResponse {
  error: boolean;
  message: string;
  data: CustomJobRequestSummaryApi[];
  total: number;
}

// ---------------------------------------------------------------------------
// get_custom_job_request_details — single request detail
// ---------------------------------------------------------------------------

export interface CustomJobBidDetailsApi {
  id: number;
  slug: string;
  profile_image: string;
  company_name: string;
  is_verified: number;
  average_rating: string;
  total_ratings: number;
  distance: number | null;
  post_booking_chat: number;
  counter_price: number;
  duration: string;
  message: string;
  date_time: string;
}

export interface CustomJobRequestCancellationApi {
  reason: string;
  additional_info: string | null;
}

export interface CustomJobRequestDetailApi {
  id: number;
  title: string;
  description: string;
  category_name: string;
  status: string;
  start_date_time: string;
  end_date_time: string;
  phone: string;
  country_code: string;
  attachments: {
    images: string[];
    videos: string[];
    others: string[];
  };
  bid_details: CustomJobBidDetailsApi | null;
  cancellation: CustomJobRequestCancellationApi | null;
}

export interface CustomJobRequestDetailResponse {
  error: boolean;
  message: string;
  data: CustomJobRequestDetailApi | null;
}

// ---------------------------------------------------------------------------
// get_custom_job_request_providers — bidder list for a request
// ---------------------------------------------------------------------------

export type CustomJobProviderSort =
  | "price_high_to_low"
  | "price_low_to_high"
  | "rating_high_to_low"
  | "rating_low_to_high"
  | "distance_low_to_high"
  | "distance_high_to_low"
  | "duration_shortest_first"
  | "duration_longest_first";

export interface CustomJobRequestProviderApi {
  custom_job_id: number;
  provider_id: number;
  company_name: string;
  provider_image: string;
  average_rating: string;
  total_ratings: number;
  address: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  counter_price: number;
  duration: string;
  bid_date: string;
  message: string;
  is_provider_verified: number;
  pre_booking_chat: number;
  at_doorstep?: number;
  at_store?: number;
}

export interface CustomJobRequestProvidersResponse {
  error: boolean;
  message: string;
  data: CustomJobRequestProviderApi[];
  code: number;
  total: number;
}
