import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { useIsMobile } from "@/lib/use-is-mobile";
import { openAuthModal, openLoginGate } from "@/store/slices/auth-modal-slice";

/**
 * Gate any action behind login: requireAuth(fn) runs fn if logged in.
 * Otherwise, desktop opens the sign-in dialog directly; mobile shows the
 * "Login Required" bottom sheet first (see LoginRequiredSheet) since the
 * sign-in form itself is full-screen there.
 */
export function useRequireAuth() {
  const dispatch = useAppDispatch();
  const hasHydrated = useHasHydrated();
  const isMobile = useIsMobile();
  const loggedIn = useAppSelector((state) => Boolean(state.auth.token && state.auth.user));
  const isLoggedIn = hasHydrated && loggedIn;

  const requireAuth = (fn: () => void) => {
    if (isLoggedIn) {
      fn();
    } else if (isMobile) {
      dispatch(openLoginGate());
    } else {
      dispatch(openAuthModal("signin"));
    }
  };

  return { isLoggedIn, requireAuth };
}
