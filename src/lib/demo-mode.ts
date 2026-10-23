import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import type { AuthUser } from "@/store/slices/auth-slice";

// Envato reviewers/demo visitors log in with this fixed account instead of
// a real phone number — general_settings.demo_mode gates every place that
// should pre-fill or otherwise special-case it.
export const DEMO_CREDENTIALS = {
  NATIONAL_NUMBER: "9876543210",
  DIAL_CODE: "+91",
  PASSWORD: "Test@123",
} as const;

/** general_settings.demo_mode — true pre-fills the demo phone/password in
 * the sign-in modal and blocks the demo account from deleting itself. */
export function useIsDemoMode(): boolean {
  const hasHydrated = useHasHydrated();
  const demoMode = useAppSelector((state) => {
    const generalSettings = state.settings.data?.general_settings as
      | { demo_mode?: string | number | boolean }
      | undefined;
    const value = generalSettings?.demo_mode;
    return value === "1" || value === 1 || value === true;
  });
  // See use-category-details-view-type.ts — settings can rehydrate from
  // localStorage before the first client render; force false until
  // hydration is confirmed so the first client render matches SSR.
  return hasHydrated ? demoMode : false;
}

/** Digits-only comparison — `user.phone` may or may not carry the dial code
 * depending on login path, so match on the national number's tail instead
 * of requiring an exact shape. */
export function isDemoAccount(user: Pick<AuthUser, "phone"> | null | undefined): boolean {
  if (!user?.phone) return false;
  return user.phone.replace(/\D/g, "").endsWith(DEMO_CREDENTIALS.NATIONAL_NUMBER);
}
