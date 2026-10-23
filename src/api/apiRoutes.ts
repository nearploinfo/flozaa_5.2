import api from "./apiMiddleware";
import * as apiEndPoints from "./apiEndPoints";

type ParamValue = string | number | boolean | File | Blob | undefined | null;
type Params = Record<string, ParamValue | ParamValue[]>;

function buildFormData(params: Params = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        formData.append(`${key}[]`, item instanceof Blob ? item : String(item));
      }
      continue;
    }
    formData.append(key, value instanceof Blob ? value : String(value));
  }
  return formData;
}

async function postApi(endpoint: string, params: Params = {}) {
  try {
    const response = await api.post(endpoint, buildFormData(params));
    return response?.data;
  } catch (error) {
    console.error(`Error in ${endpoint}:`, error);
    throw error;
  }
}

// Axios only sets `error.response` when a server actually answered (even
// with a 4xx/5xx) — a connection-level failure (down host, DNS, timeout,
// reset) never gets one. That's the one signal that distinguishes "the API
// told us no" from "we couldn't even reach the API".
function isNetworkFailure(error: unknown): boolean {
  return typeof error === "object" && error !== null && "isAxiosError" in error && !(error as { response?: unknown }).response;
}

async function postApiSafe(endpoint: string, params: Params = {}) {
  try {
    const response = await api.post(endpoint, buildFormData(params));
    return response?.data;
  } catch (error) {
    console.error(`Error in ${endpoint}:`, error);
    // Server-side (getServerSideProps) callers treat a null response as "the
    // API says this doesn't exist" and render a 404 — which is wrong for a
    // network failure. Rethrowing there instead lets Next's built-in error
    // handling take over (pages/_error.tsx), globally, with no per-page
    // wiring. Client-side callers keep the old null-and-degrade contract —
    // rethrowing there would turn every fire-and-forget `.then()` call site
    // across the app into an unhandled rejection.
    if (typeof window === "undefined" && isNetworkFailure(error)) throw error;
    return null;
  }
}

async function getApi(endpoint: string, params: Params = {}) {
  try {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      query.append(key, String(value));
    }
    const qs = query.toString();
    const response = await api.get(qs ? `${endpoint}?${qs}` : endpoint);
    return response?.data;
  } catch (error) {
    console.error(`Error in ${endpoint}:`, error);
    throw error;
  }
}

// Home / Discovery
export const getHomeScreenDataApi = (params?: Params) => postApiSafe(apiEndPoints.getHomePage, params);
export const getCategoryApi = (params?: Params) => postApiSafe(apiEndPoints.getCategory, params);
export const getSubCategoriesApi = (params?: Params) => postApiSafe(apiEndPoints.getSubCategories, params);
export const allCategoriesApi = (params?: Params) => postApiSafe(apiEndPoints.allCategories, params);
export const allCategoriesHierarchicalApi = (params?: Params) => postApiSafe(apiEndPoints.allCategoriesHierarchical, params);
export const getCategoriesHierarchicalApi = (params?: Params) => postApiSafe(apiEndPoints.getCategoriesHierarchical, params);
export const getParentCategorySlugApi = (params?: Params) => postApi(apiEndPoints.getParentCategorySlug, params);
export const getProvidersApi = (params?: Params) => postApi(apiEndPoints.getProviders, params);
export const getProvidersOnMapApi = (params?: Params) => postApi(apiEndPoints.getProvidersOnMap, params);
export const getAllProvidersApi = (params?: Params) => postApiSafe(apiEndPoints.getAllProviders, params);
export const getProviderDetailsApi = (params?: Params) => postApiSafe(apiEndPoints.getProviderDetails, params);
export const getServicesApi = (params?: Params) => postApi(apiEndPoints.getServices, params);
export const getAllServicesApi = (params?: Params) => postApiSafe(apiEndPoints.getAllServices, params);
export const getServiceDetailsApi = (params?: Params) => postApiSafe(apiEndPoints.getServiceDetails, params);
export const searchServicesProvidersApi = (params?: Params) => postApi(apiEndPoints.searchServicesProviders, params);
export const getPlacesForWebApi = (params?: Params) => getApi(apiEndPoints.getPlacesForWeb, params);
export const getPlacesDeatilsForWebApi = (params?: Params) => getApi(apiEndPoints.getPlacesDeatilsForWeb, params);

// Settings / Config
export const getSettingsApi = (params?: Params) => postApiSafe(apiEndPoints.getSettings, params);
export const getThemeColorsApi = () => getApi(apiEndPoints.getThemeColors);
export const getWebLandingPageApi = (params?: Params) => postApiSafe(apiEndPoints.getWebLandingPage, params);
export const getBecomeProviderSetingsApi = (params?: Params) => postApiSafe(apiEndPoints.getBecomeProviderSetings, params);
export const getPageSettingsApi = (params?: Params) => postApiSafe(apiEndPoints.getPageSettings, params);
export const getCustomPagesApi = (params?: Params) => postApiSafe(apiEndPoints.getCustomPages, params);
export const getSeoSettingsApi = (params?: Params) => postApiSafe(apiEndPoints.getSeoSettings, params);
export const getLanguageListApi = (params?: Params) => getApi(apiEndPoints.getLanguageList, params);
export const getLanguageJsonDataApi = (params?: Params) => postApi(apiEndPoints.getLanguageJsonData, params);
export const getAddressCustomFieldsApi = (params?: Params) => postApiSafe(apiEndPoints.getAddressCustomFields, params);
export const getChatQuestionsApi = (params?: Params) => postApi(apiEndPoints.getChatQuestions, params);

// Auth (customer)
export const verifyUserApi = (params?: Params) => postApi(apiEndPoints.verifyUser, params);
export const manageUserApi = (params?: Params) => postApi(apiEndPoints.manageUser, params);
export const verifyOTPApi = (params?: Params) => postApi(apiEndPoints.verifyOTP, params);
export const resendOTPApi = (params?: Params) => postApi(apiEndPoints.resendOTP, params);
export const updateUserApi = (params?: Params) => postApi(apiEndPoints.updateUser, params);
export const deleteUserAccountApi = (params?: Params) => postApi(apiEndPoints.deleteUserAccount, params);
export const logoutApi = (params?: Params) => postApi(apiEndPoints.logout, params);
export const getUserInfoApi = (params?: Params) => postApi(apiEndPoints.getUserInfo, params);
export const updateFcmApi = (params?: Params) => postApi(apiEndPoints.updateFcm, params);

// Auth (provider)
export const registerProviderApi = (params?: Params) => postApi(apiEndPoints.registerProvider, params);
export const verifyProviderApi = (params?: Params) => postApi(apiEndPoints.verifyProvider, params);
export const verifyProviderOtpApi = (params?: Params) => postApi(apiEndPoints.verifyProviderOtp, params);
export const resendProviderOtpApi = (params?: Params) => postApi(apiEndPoints.resendProviderOtp, params);
export const changePasswordApi = (params?: Params) => postApi(apiEndPoints.changePassword, params);

// Address
export type AddressType = "home" | "office" | "other";

// Backend returns `type` capitalized ("Home") even though it accepts lowercase
// on write — normalize on every read so lookups keyed by AddressType don't miss.
export function normalizeAddressType(raw: string): AddressType {
  const lower = raw.toLowerCase();
  return lower === "home" || lower === "office" || lower === "other" ? lower : "other";
}

export interface AddressApi {
  id: string;
  type: AddressType;
  address: string;
  mobile: string;
  lattitude: string;
  longitude: string;
  is_default: string;
  country_id?: string | null;
  country?: string | null;
  region_id?: string | null;
  region?: string | null;
}

export interface AddressListResponse {
  error: boolean;
  message: string;
  data: AddressApi[];
  total: string;
}

export type AddressCustomFieldType = "text" | "number" | "textarea";

export interface AddressCustomFieldApi {
  id: number;
  label: string;
  placeholder?: string;
  field_type: AddressCustomFieldType;
  required: number;
  visible: number;
  sort_order: number;
}

export interface AddressCustomFieldValueApi {
  custom_field_id: number;
  value: string;
}

export interface AddressCustomFieldsResponse {
  error: boolean;
  message: string;
  data: {
    custom_fields: AddressCustomFieldApi[];
    customer_address_custom_fields: AddressCustomFieldValueApi[];
  };
}

export const addAddressApi = (params?: Params) => postApi(apiEndPoints.addAddress, params);
export const deleteAddressApi = (params?: Params) => postApi(apiEndPoints.deleteAddress, params);
export const getAddressApi = (params?: Params) => postApi(apiEndPoints.getAddress, params);
export const requestAreaCoverageApi = (params?: Params) => postApi(apiEndPoints.requestAreaCoverage, params);

export interface GeoBoundary {
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
}

export interface CountryApi {
  id: number;
  name: string;
  flag?: string;
  /** Bounding box — lets the address form resolve a pin's country by simple
   * containment instead of fuzzy-matching a reverse-geocoded name (which
   * broke on abbreviations like "UK" and substring collisions like
   * "India"/"British Indian Ocean Territory"). null for a handful of
   * countries with no boundary data on the backend. */
  boundary: GeoBoundary | null;
}

export interface CountryListResponse {
  error: boolean;
  message: string;
  data: CountryApi[];
}

export interface RegionApi {
  id: number;
  name: string;
  boundary?: GeoBoundary | null;
}

export interface RegionListResponse {
  error: boolean;
  message: string;
  data: RegionApi[];
}

/** One payment gateway enabled for the resolved country — key field name
 * differs per gateway (key: Razorpay/Paystack, publishable_key: Stripe,
 * client_key: PayPal, public_key: Flutterwave). Only populated for an
 * authenticated request; empty for a guest even when gateways are enabled. */
export interface CountryPaymentGateway {
  gateway: string;
  label: string;
  mode: string;
  currency: string;
  key?: string;
  publishable_key?: string;
  client_key?: string;
  public_key?: string;
}

export interface CountrySettingsApi {
  currency: string;
  currency_symbol: string;
  currency_decimal_places: number;
  date_format: string;
  time_format: string;
  /** 0 = hide cash on delivery, 1 = show. Still returned for guests. */
  cod_setting?: number;
  /** 0 = online payment off (payment_gateways always empty), 1 = on. */
  payment_gateway_setting?: number;
  payment_gateways?: CountryPaymentGateway[];
}

export interface CountrySettingsResponse {
  error: boolean;
  message: string;
  data: CountrySettingsApi;
}

export interface CountryCodeApi {
  id: string;
  country_name: string;
  /** ISO 3166-1 alpha-2, e.g. "IN" — matches react-phone-input-2's per-country flag class (lowercased). */
  country_code: string;
  /** Dial code with leading "+", e.g. "+91". */
  calling_code: string;
  is_default: string;
  flag_image: string;
}

export interface CountryCodeListResponse {
  error: boolean;
  message: string;
  data: CountryCodeApi[];
}

// Public — no auth needed.
export const getCountriesApi = () => getApi(apiEndPoints.getCountries);
export const getRegionsApi = (params?: Params) => postApi(apiEndPoints.getRegions, params);
export const getCountrySettingsApi = (params?: Params) => postApi(apiEndPoints.getCountrySettings, params);
export const getCountryCodesApi = () => getApi(apiEndPoints.getCountryCodes);

// Cart / Checkout
export const getCartApi = (params?: Params) => postApi(apiEndPoints.getCart, params);
export const manageCartApi = (params?: Params) => postApi(apiEndPoints.manageCart, params);
// remove_from_cart never wraps in the usual {error, message, data} envelope —
// the body IS the cart payload, either a bare cart-group array or a bare
// {carts, total_service_count, ...} object. Wrap whichever shape shows up so
// callers can keep reading `response?.data` uniformly.
export const removeFromCartApi = async (params?: Params) => {
  const response = await postApi(apiEndPoints.removeFromCart, params);
  const isEnvelope = response !== null && typeof response === "object" && !Array.isArray(response) && "data" in response;
  return isEnvelope ? response : { data: response };
};
export const providerCheckAvailabilityApi = (params?: Params) => postApi(apiEndPoints.providerCheckAvailability, params);
export const checkAvailableSlotApi = (params?: Params) => postApi(apiEndPoints.checkAvailableSlot, params);
export const releaseSlotLockApi = (params?: Params) => postApi(apiEndPoints.releaseSlotLock, params);
export const getAvailableSlotApi = (params?: Params) => postApi(apiEndPoints.getAvailableSlot, params);
export const placeOrderApi = (params?: Params) => postApi(apiEndPoints.placeOrder, params);
export const getPromoCodesApi = (params?: Params) => postApi(apiEndPoints.getPromoCodes, params);
export const getAllPromocodesApi = (params?: Params) => postApi(apiEndPoints.getAllPromocodes, params);
export const validatePromoCodeApi = (params?: Params) => postApi(apiEndPoints.validatePromoCode, params);

// From get_all_promocodes (catalog listing) — id/discount/amount fields are
// numbers and dates are yyyy-MM-dd, unlike the older per-provider get_promo_codes.
export interface PromoCodeApi {
  id: number;
  promo_code: string;
  message: string;
  start_date: string;
  end_date: string;
  no_of_users: number;
  minimum_order_amount: number;
  discount: number;
  discount_type: "amount" | "percentage";
  max_discount_amount: number;
  repeat_usage: number;
  no_of_repeat_usage: number;
  image: string;
}

// Payments
export const createRazorOrderApi = (params?: Params) => postApi(apiEndPoints.createRazorOrder, params);
export const stripePaymentIntentApi = (params?: Params) => postApi(apiEndPoints.stripePaymentIntent, params);
export const createCashfreeOrderApi = (params?: Params) => postApi(apiEndPoints.createCashfreeOrder, params);
export const addTransactionApi = (params?: Params) => postApi(apiEndPoints.addTransaction, params);
export const getTransactionApi = (params?: Params) => postApi(apiEndPoints.getTransaction, params);

export type TransactionStatus = "success" | "completed" | "pending" | "failed";

export interface TransactionApi {
  id: string;
  order_id: string;
  type: string;
  txn_id: string;
  amount: string;
  status: TransactionStatus;
  transaction_date: string;
  translated_status: string;
  /** Fixed at the country the transaction was made in. */
  currency_symbol?: string;
  currency_decimal_places?: number;
}

export interface TransactionListResponse {
  error: boolean;
  message: string;
  data: TransactionApi[];
  total: number;
}

// Orders
export const getOrdersApi = (params?: Params) => postApi(apiEndPoints.getOrders, params);
export const getAllBookingsApi = (params?: Params) => postApi(apiEndPoints.getAllBookings, params);
export const getBookingDetailsApi = (params?: Params) => postApi(apiEndPoints.getBookingDetails, params);
export const updateOrderStatusApi = (params?: Params) => postApi(apiEndPoints.updateOrderStatus, params);
// Response is a raw PDF blob, not JSON — postApi's JSON handling doesn't fit,
// so this hits the client directly with responseType: "blob".
export const downloadInvoicesApi = async (params: { order_id: number }) => {
  const response = await api.post(apiEndPoints.downloadInvoices, buildFormData(params), {
    responseType: "blob",
  });
  return response.data as Blob;
};
export const getLiveTrackingDataApi = (params?: Params) => postApi(apiEndPoints.getLiveTrackingData, params);

// Custom job requests
export const makeCustomJobRequestApi = (params?: Params) => postApi(apiEndPoints.makeCustomJobRequest, params);
export const fetchMyCustomJobRequestsApi = (params?: Params) => postApi(apiEndPoints.fetchMyCustomJobRequests, params);
export const getCustomJobRequestsApi = (params?: Params) => postApi(apiEndPoints.getCustomJobRequests, params);
export const fetchMyCustomJobBiddersApi = (params?: Params) => postApi(apiEndPoints.fetchMyCustomJobBidders, params);
export const cancleCustomJobReqApi = (params?: Params) => postApi(apiEndPoints.cancleCustomJobReq, params);
export const getCustomJobRequestDetailsApi = (params?: Params) =>
  postApi(apiEndPoints.getCustomJobRequestDetails, params);
export const getCustomJobRequestProvidersApi = (params?: Params) =>
  postApi(apiEndPoints.getCustomJobRequestProviders, params);

// Ratings / Reviews
export const getRatingsApi = (params?: Params) => postApiSafe(apiEndPoints.getRatings, params);
export const addRatingApi = (params?: Params) => postApi(apiEndPoints.addRating, params);
export const saveHandymanReviewApi = (params?: Params) => postApi(apiEndPoints.saveHandymanReview, params);
export const getHandymanReviewsApi = (params?: Params) => postApi(apiEndPoints.getHandymanReviews, params);

// Bookmarks
export type BookmarkType = "service" | "provider";

export const addBookmarkApi = (params: { bookmark_type: BookmarkType; service_id?: number; partner_id?: number }) =>
  postApi(apiEndPoints.bookMark, { ...params, type: "add" });

export const removeBookmarkApi = (params: { bookmark_type: BookmarkType; service_id?: number; partner_id?: number }) =>
  postApi(apiEndPoints.bookMark, { ...params, type: "remove" });

export const listBookmarksApi = (params: {
  bookmark_type: BookmarkType;
  latitude?: number;
  longitude?: number;
  limit?: number;
  offset?: number;
  search?: string;
}) => postApi(apiEndPoints.bookMark, { ...params, type: "list" });

// Notifications
export interface NotificationApi {
  id: string;
  title: string;
  message: string;
  image: string;
  is_readed: string;
  date_sent: string;
}

export interface NotificationsResponse {
  error: boolean;
  message: string;
  data: NotificationApi[];
  total: number;
}

export const getNotificationsApi = (params?: Params) => postApi(apiEndPoints.getNotifications, params);

// Chat
export const getChatProviderListApi = (params?: Params) => postApi(apiEndPoints.getChatProviderList, params);
export const getChatHistoryApi = (params?: Params) => postApi(apiEndPoints.getChatHistory, params);
export const sendChatMessageApi = (params?: Params) => postApi(apiEndPoints.sendChatMessage, params);
export const blockUserApi = (params?: Params) => postApi(apiEndPoints.blockUser, params);
export const unblockUserApi = (params?: Params) => postApi(apiEndPoints.unblockUser, params);
export const deleteChatUserApi = (params?: Params) => postApi(apiEndPoints.deleteChatUser, params);
export const markMessageAsReadApi = (params?: Params) => postApi(apiEndPoints.markMessageAsRead, params);
export const getBlockedProvidersApi = (params?: Params) => getApi(apiEndPoints.getBlockedProviders, params);

// Reasons
export const getReportReasonsApi = (params?: Params) => getApi(apiEndPoints.getReportReasons, params);
export const getReasonsApi = (params?: Params) => postApi(apiEndPoints.getReasons, params);

// Content
export const getFaqsApi = (params?: Params) => postApi(apiEndPoints.getFaqs, params);
export const contactUsApi = (params?: Params) => postApi(apiEndPoints.contactUsApi, params);
export const getBlogsApi = (params?: Params) => getApi(apiEndPoints.getBlogs, params);
export const getSiteMapDataApi = (params?: Params) => getApi(apiEndPoints.getSiteMapData, params);
export const getBlogCategoriesApi = (params?: Params) => getApi(apiEndPoints.getBlogCategories, params);
export const getBlogTagsApi = (params?: Params) => getApi(apiEndPoints.getBlogTags, params);
export const getBlogDetailsApi = (params?: Params) => postApi(apiEndPoints.getBlogDetails, params);
