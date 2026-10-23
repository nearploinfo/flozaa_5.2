/**
 * Microsoft Clarity event name catalog — mirrors the taxonomy used by the
 * mobile app so product analytics dashboards stay unified across platforms.
 *
 * Keep the raw string values in sync with the mobile app; avoid renaming
 * keys without coordinating with analytics.
 */

export const APP_LIFECYCLE_EVENTS = {
  APP_LAUNCH: "app_launch",
  APP_RESUME: "app_resume",
  APP_BACKGROUND: "app_background",
} as const;

export const AUTH_EVENTS = {
  OTP_SENT: "otp_sent",
  OTP_VERIFIED: "otp_verified",
  LOGIN_ATTEMPT: "login_attempt",
  LOGIN_SUCCESS: "login_success",
  LOGOUT: "logout",
  PROFILE_UPDATE_SAVED: "profile_update_saved",
  ADDRESS_ADDED: "address_added",
  ADDRESS_DELETED: "address_deleted",
  DELETE_ACCOUNT_CONFIRMED: "delete_account_confirmed",
  LANGUAGE_CHANGED: "language_changed",
  THEME_CHANGED: "theme_changed",
} as const;

export const HOME_EVENTS = {
  HOME_BANNER_TAPPED: "home_banner_tapped",
  HOME_CATEGORY_SHORTCUT_TAPPED: "home_category_shortcut_tapped",
  HOME_POPULAR_SERVICE_TAPPED: "home_popular_service_tapped",
  SEARCH_SCREEN_OPENED: "search_screen_opened",
  SERVICE_SEARCH_SUBMITTED: "service_search_submitted",
} as const;

export const SERVICE_EVENTS = {
  SERVICE_DETAIL_VIEWED: "service_detail_viewed",
  SERVICE_REVIEW_SUBMITTED: "service_review_submitted",
} as const;

export const CART_EVENTS = {
  CART_VIEWED: "cart_viewed",
  CART_ITEM_ADDED: "cart_item_added",
  CART_ITEM_REMOVED: "cart_item_removed",
  CART_CLEARED: "cart_cleared",
  CART_CHECKOUT_TAPPED: "cart_checkout_tapped",
} as const;

export const BOOKING_EVENTS = {
  TIMESLOT_PICKER_OPENED: "timeslot_picker_opened",
  TIMESLOT_SLOT_SELECTED: "timeslot_slot_selected",
  TIMESLOT_CUSTOM_TIME_ENTERED: "timeslot_custom_time_entered",
  TIMESLOT_VALIDATION_FAILED: "timeslot_validation_failed",
  BOOKING_REQUESTED: "booking_requested",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_COMPLETED: "booking_completed",
  BOOKING_RESCHEDULED: "booking_rescheduled",
  BOOKING_ADDITIONAL_CHARGE_APPROVED: "booking_additional_charge_approved",
} as const;

export const PAYMENT_EVENTS = {
  PROMO_CODE_APPLIED: "promo_code_applied",
  PROMO_CODE_FAILED: "promo_code_failed",
  PAYMENT_METHOD_SELECTED: "payment_method_selected",
  PAYMENT_STARTED: "payment_started",
  PAYMENT_GATEWAY_REDIRECTED: "payment_gateway_redirected",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
} as const;

export const SUPPORT_EVENTS = {
  CUSTOM_JOB_REQUEST_CREATED: "custom_job_request_created",
  CUSTOM_JOB_REQUEST_CANCELLED: "custom_job_request_cancelled",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  SUPPORT_TICKET_CREATED: "support_ticket_created",
} as const;

export const MISC_EVENTS = {
  MAINTENANCE_MODE_VIEWED: "maintenance_mode_viewed",
  NOTIFICATION_OPENED: "notification_opened",
  CHUNK_ERROR_RECOVERY_SKIPPED: "chunk_error_recovery_skipped",
} as const;

export const ALL_CLARITY_EVENTS = {
  ...APP_LIFECYCLE_EVENTS,
  ...AUTH_EVENTS,
  ...HOME_EVENTS,
  ...SERVICE_EVENTS,
  ...CART_EVENTS,
  ...BOOKING_EVENTS,
  ...PAYMENT_EVENTS,
  ...SUPPORT_EVENTS,
  ...MISC_EVENTS,
} as const;
