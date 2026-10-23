import { useAppSelector } from "@/store/hooks";

/** System-wide toggle (general_settings.allow_post_booking_chat), distinct from a specific provider's own post_booking_chat flag — both must be true for the chat action to be usable. */
export function usePostBookingChatEnabled(): boolean {
  return useAppSelector((state) => {
    const generalSettings = state.settings.data?.general_settings as
      | { allow_post_booking_chat?: number | string }
      | undefined;
    const value = generalSettings?.allow_post_booking_chat;
    return value === 1 || value === "1";
  });
}
