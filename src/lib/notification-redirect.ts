/**
 * Maps a notification payload to the in-app route it should open, or null
 * when the notification isn't meant to navigate anywhere (moderation/status
 * notices, or a content type missing the id/slug it needs).
 *
 * Type is read from whichever of these fields the backend actually sent:
 * type → notification_type → notificationType → web_click_type →
 * redirect_type. No type at all falls back to a direct url/redirectUrl
 * field (e.g. Firebase Console test notifications only send `url`).
 *
 * `click_action` (e.g. "FLUTTER_NOTIFICATION_CLICK") is Flutter-specific and
 * intentionally ignored here — irrelevant on web.
 */

type NotificationData = Record<string, unknown>;

function str(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s ? s : undefined;
}

export function getNotificationRedirectUrl(data: NotificationData | null | undefined): string | null {
  if (!data) return null;

  const rawType =
    data.type ?? data.notification_type ?? data.notificationType ?? data.web_click_type ?? data.redirect_type;

  if (!rawType) {
    return str(data.url) ?? str(data.redirectUrl) ?? str(data.redirect_url) ?? null;
  }

  const type = String(rawType).toLowerCase().trim();
  const redirectType = String(data.redirect_type ?? data.web_click_type ?? "").toLowerCase().trim();

  const bookingRelatedTypes = new Set([
    "booking_status",
    "booking status",
    "booking_confirmed",
    "new_booking_confirmation_to_customer",
    "booking_rescheduled",
    "booking_cancelled",
    "booking_completed",
    "booking_started",
    "booking_ended",
    "order",
    "payment",
    "online_payment_failed",
    "online payment failed",
    "online_payment_success",
    "online payment success",
    "online_payment_pending",
    "online payment pending",
    "payment_refund_executed",
    "payment refund executed",
    "payment_refund_successful",
    "payment refund successful",
    "additional_charges",
    "added_additional_charges",
    "added additional charges",
    "rating_request",
    "review_request_after_booking_completion",
    "review the request after booking completion",
  ]);

  if (bookingRelatedTypes.has(type)) {
    const bookingId = str(data.booking_id) ?? str(data.bookingId) ?? str(data.order_id) ?? str(data.orderId) ?? str(data.id);
    return bookingId ? `/booking/${bookingId}` : null;
  }

  if (type === "bid" || type === "bid_on_custom_job_request" || type === "bid on a custom job request") {
    const jobId =
      str(data.custom_job_request_id) ?? str(data.customJobRequestId) ?? str(data.job_id) ?? str(data.jobId);
    return jobId ? `/my-service-request-details/${jobId}` : null;
  }

  if (type === "new_blog" || type === "new blog") {
    const blogSlug =
      str(data.blog_slug) ?? str(data.blogSlug) ?? str(data.slug) ?? str(data.blog_id) ?? str(data.blogId) ?? str(data.id);
    return blogSlug ? `/blog-details/${blogSlug}` : null;
  }

  if (type === "privacy_policy_changed" || type === "privacy policy changed") {
    return "/privacy-policy";
  }

  if (
    type === "terms_and_conditions_changed" ||
    type === "terms and conditions changed" ||
    type === "terms_and_conditions" ||
    type === "terms and conditions"
  ) {
    return "/terms-and-conditions";
  }

  // Intentionally no redirect: account status/moderation notices and
  // app-wide informational notices have no target page to land on.
  if (
    type === "user_account_active" ||
    type === "user_account_deactive" ||
    type === "user_blocked" ||
    type === "user_reported" ||
    type === "general" ||
    type === "maintenance_mode"
  ) {
    return null;
  }

  if (type === "service" || type === "service_details" || type === "service details") {
    const providerSlug = str(data.provider_slug) ?? str(data.providerSlug) ?? str(data.provider_id) ?? str(data.providerId);
    const serviceSlug =
      str(data.service_slug) ?? str(data.serviceSlug) ?? str(data.slug) ?? str(data.service_id) ?? str(data.serviceId);
    return providerSlug && serviceSlug ? `/provider-details/${providerSlug}/${serviceSlug}` : null;
  }

  if (type === "provider" || redirectType === "provider-details") {
    const providerSlug =
      str(data.provider_slug) ?? str(data.providerSlug) ?? str(data.slug) ?? str(data.provider_id) ?? str(data.providerId) ?? str(data.id);
    return providerSlug ? `/provider-details/${providerSlug}` : null;
  }

  if (type === "category" || redirectType === "category") {
    const rawParentSlugs =
      data.parent_category_slugs ?? data.parentCategorySlugs ?? data.parent_slugs ?? data.parent_categories ?? [];

    let parentSlugs: unknown[];
    if (typeof rawParentSlugs === "string") {
      try {
        const parsed: unknown = JSON.parse(rawParentSlugs);
        parentSlugs = Array.isArray(parsed) ? parsed : [];
      } catch {
        parentSlugs = rawParentSlugs.split(",").map((p) => p.trim()).filter(Boolean);
      }
    } else {
      parentSlugs = Array.isArray(rawParentSlugs) ? rawParentSlugs : [];
    }

    const validParentSlugs = parentSlugs.map((slug) => String(slug).trim()).filter((slug) => slug.length > 0);

    const categorySlug =
      str(data.category_slug) ?? str(data.categorySlug) ?? str(data.slug) ?? str(data.category_id) ?? str(data.categoryId);

    if (validParentSlugs.length === 0 && !categorySlug) return null;

    let route = "/service";
    if (validParentSlugs.length > 0) route += `/${validParentSlugs.join("/")}`;
    if (categorySlug) route += `/${categorySlug}`;
    return route;
  }

  // `chat_user` absent means it's an admin/support chat (no partner_id involved).
  if (type === "chat" || type === "message" || type === "new_message" || type === "new message") {
    if (!data.chat_user) return "/chats/admin";

    const partnerId = str(data.sender_id) ?? str(data.partner_id);
    if (!partnerId) return "/chats";

    const bookingId = str(data.booking_id);
    return `/chats/${bookingId ? `${partnerId}_${bookingId}` : `${partnerId}_pre`}`;
  }

  if (type === "url") {
    const url = str(data.url);
    if (url) return url;
  }

  return null;
}

export function isNotificationRedirectable(data: NotificationData | null | undefined): boolean {
  return getNotificationRedirectUrl(data) !== null;
}

/**
 * CTA label key (under account.notifications.cta.*) for a redirectable
 * notification's "View X" link, derived from the resolved URL's path so it
 * doesn't need to re-parse the notification type separately.
 */
export function getNotificationCtaLabelKey(url: string): string {
  if (url.startsWith("/booking/")) return "booking";
  if (url.startsWith("/my-service-request-details/")) return "request";
  if (url.startsWith("/blog-details/")) return "blog";
  if (url.startsWith("/provider-details/")) return "provider";
  if (url.startsWith("/service/")) return "service";
  if (url.startsWith("/chats")) return "chat";
  if (url === "/privacy-policy" || url === "/terms-and-conditions") return "page";
  return "details";
}
