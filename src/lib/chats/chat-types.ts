import { toBookingStatusKey } from "@/lib/orders-catalog";
import type { BookingStatusKey } from "@/lib/helpers";
import { localizePath } from "@/lib/i18n/locale-path";

export interface ChatFile {
  file: string;
  file_name: string;
  file_type: string;
}

export interface ChatMessageApi {
  id?: number;
  message: string;
  file: string | ChatFile[] | null;
  sender_id: number | string;
  sender_details?: { id: number | string; username?: string; image?: string } | null;
  created_at: string;
  /** "1"/"0" (or 1/0) — read state of the message from the recipient's side. */
  is_read?: string | number;
}

export interface ChatListItemApi {
  partner_id: number;
  booking_id: number | null;
  partner_name: string;
  translated_partner_name?: string;
  image: string;
  /** Most recent non-deleted message text; null for attachment-only chats. */
  last_message?: string | null;
  un_read_chats?: string | number;
  order_status?: string;
  updated_at?: string;
  is_provider_verified?: number;
}

/** Same conversation reached via different tabs collapses to one key: partner+booking (or partner+"pre" when there's no booking). */
export function getChatUniqueId(chat: { partner_id: number; booking_id: number | null }): string {
  return chat.booking_id ? `${chat.partner_id}_${chat.booking_id}` : `${chat.partner_id}_pre`;
}

/** Reverses getChatUniqueId — used to hydrate a chat straight from the URL before its row has loaded in the list. */
export function parseChatUniqueId(uniqueId: string): { partner_id: number; booking_id: number | null } | null {
  const [partnerPart, bookingPart] = uniqueId.split("_");
  const partnerId = Number(partnerPart);
  if (!Number.isFinite(partnerId)) return null;
  if (bookingPart === "pre" || bookingPart === undefined) return { partner_id: partnerId, booking_id: null };
  const bookingId = Number(bookingPart);
  return { partner_id: partnerId, booking_id: Number.isFinite(bookingId) ? bookingId : null };
}

export function parseChatFiles(raw: ChatMessageApi["file"]): ChatFile[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function chatBookingStatusKey(orderStatus: string | undefined): BookingStatusKey | null {
  if (!orderStatus) return null;
  return toBookingStatusKey(orderStatus);
}

/**
 * Deep-links from provider/service/booking pages carry a few known-now-but-not-yet-in-list
 * fields as query params — the chat screen has nothing else to show a header/summary with
 * until this conversation's own list row loads (or forever, for brand-new pre-booking chats).
 */
export function buildChatHref(
  params: {
    partnerId: number;
    bookingId: number | null;
    name: string;
    image: string;
    status?: string;
    title?: string;
    extraCount?: number;
    date?: string;
    time?: string;
  },
  lang: string,
  defaultLocale: string
): string {
  const uniqueId = getChatUniqueId({ partner_id: params.partnerId, booking_id: params.bookingId });
  const query = new URLSearchParams({
    type: params.bookingId ? "booking" : "pre_booking",
    name: params.name,
    image: params.image,
  });
  if (params.status) query.set("status", params.status);
  if (params.title) query.set("title", params.title);
  if (params.extraCount) query.set("extraCount", String(params.extraCount));
  if (params.date) query.set("date", params.date);
  if (params.time) query.set("time", params.time);
  return `${localizePath(`/chats/${uniqueId}`, lang, defaultLocale)}?${query.toString()}`;
}
