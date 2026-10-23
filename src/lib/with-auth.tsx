"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { useIsMobile } from "@/lib/use-is-mobile";
import { openAuthModal, openLoginGate } from "@/store/slices/auth-modal-slice";
import { localizePath } from "@/lib/i18n/locale-path";
import { useTranslation } from "@/lib/i18n/translation-context";

/**
 * Wrap a page component that requires a logged-in user (account pages:
 * profile, bookmarks, addresses, payment history, etc). Auth lives in
 * localStorage via redux-persist, so it's unreadable during SSR and on the
 * very first client render — wait for hasHydrated before deciding, or a
 * logged-in user gets bounced by a false "not logged in" read.
 *
 * Not logged in once hydrated: redirects to home, rendering nothing in the
 * meantime (no flash of protected content or its data fetches firing for a
 * guest). The sign-in modal only pops open for a guest who landed here never
 * having been logged in — if this same mount was logged in and then logged
 * out (e.g. clicking Logout while sitting on this page), just redirect
 * silently; popping the modal back up right after the user chose to log out
 * would read as the logout not having worked.
 */
export function withAuth<P extends object>(Component: ComponentType<P>) {
  function AuthGuardedPage(props: P) {
    const hasHydrated = useHasHydrated();
    const isMobile = useIsMobile();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { lang, defaultLocale } = useTranslation();
    const isLoggedIn = useAppSelector((state) => Boolean(state.auth.token && state.auth.user));
    const wasLoggedInRef = useRef(false);

    useEffect(() => {
      if (!hasHydrated) return;
      if (isLoggedIn) {
        wasLoggedInRef.current = true;
        return;
      }
      if (!wasLoggedInRef.current) dispatch(isMobile ? openLoginGate() : openAuthModal("signin"));
      router.replace(localizePath("/", lang, defaultLocale));
    }, [hasHydrated, isLoggedIn, isMobile, dispatch, router, lang, defaultLocale]);

    if (!hasHydrated || !isLoggedIn) return null;

    return <Component {...props} />;
  }

  AuthGuardedPage.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;
  return AuthGuardedPage;
}
