import { useAppSelector } from "@/store/hooks";

/** System-wide toggle (general_settings.otp_system) — booking OTP is only
 * shown at all when admin has this enabled, regardless of booking status. */
export function useOtpSystemEnabled(): boolean {
  return useAppSelector((state) => {
    const generalSettings = state.settings.data?.general_settings as
      | { otp_system?: number | string }
      | undefined;
    const value = generalSettings?.otp_system;
    return value === 1 || value === "1";
  });
}
