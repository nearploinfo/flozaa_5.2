"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
  LEGACY_CONSENT_COOKIE_NAME,
  defaultConsent,
  parseConsentCookie,
  readCookie,
  removeCookie,
  serializeConsentCookie,
  writeCookie,
  type ConsentValue,
} from "@/lib/cookie-consent";
import { useCookieConsentSettings } from "@/lib/use-cookie-consent-settings";

interface ConsentContextValue {
  /** null until resolved from the cookie on mount — gate any consent-gated script on this, not just the category flags. */
  consent: ConsentValue | null;
  showDialog: boolean;
  updateConsent: (updates: Partial<Omit<ConsentValue, "essential" | "version">>) => void;
  acceptAll: () => void;
  declineAll: () => void;
  reopenSettings: () => void;
  closeDialog: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Google Consent Mode v2 — tells GA4 which storage categories it may use, both on
 * mount (returning visitor) and whenever the user changes their choice. */
function pushConsentModeUpdate(consent: ConsentValue): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  // True once we know the visitor already made a choice (stored cookie, or
  // migrated from the legacy cookie) — the admin-disabled auto-accept below
  // must never override a decision the visitor already made.
  const hasStoredDecision = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time gate synced from cookie storage (unreadable during SSR), not derivable from props/state */
    const saved = parseConsentCookie(readCookie(CONSENT_COOKIE_NAME));

    if (saved) {
      if (saved.version !== CONSENT_VERSION) {
        removeCookie(CONSENT_COOKIE_NAME);
        setConsent(defaultConsent);
        setShowDialog(true);
        return;
      }
      setConsent(saved);
      setShowDialog(false);
      hasStoredDecision.current = true;
      pushConsentModeUpdate(saved);
      return;
    }

    // Migrate the old binary cookie-consent cookie if present.
    const legacy = readCookie(LEGACY_CONSENT_COOKIE_NAME);
    if (legacy === "accepted" || legacy === "declined") {
      const accepted = legacy === "accepted";
      const migrated: ConsentValue = {
        essential: true,
        functional: accepted,
        analytics: accepted,
        marketing: accepted,
        version: CONSENT_VERSION,
      };
      writeCookie(CONSENT_COOKIE_NAME, serializeConsentCookie(migrated));
      setConsent(migrated);
      setShowDialog(false);
      hasStoredDecision.current = true;
      pushConsentModeUpdate(migrated);
      return;
    }

    setConsent(defaultConsent);
    setShowDialog(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const { status: cookieConsentStatus } = useCookieConsentSettings();

  useEffect(() => {
    // Admin disabled the consent requirement (non-EU deployment) and the
    // visitor never made an explicit choice — auto-grant everything so
    // Maps/Analytics aren't silently blocked, and skip the dialog.
    if (cookieConsentStatus !== "disabled" || hasStoredDecision.current) return;
    setConsent((prev) => {
      const next: ConsentValue = { essential: true, functional: true, analytics: true, marketing: true, version: CONSENT_VERSION };
      writeCookie(CONSENT_COOKIE_NAME, serializeConsentCookie(next));
      writeCookie(LEGACY_CONSENT_COOKIE_NAME, "accepted");
      pushConsentModeUpdate(next);
      return prev?.functional && prev?.analytics && prev?.marketing ? prev : next;
    });
    hasStoredDecision.current = true;
    setShowDialog(false);
  }, [cookieConsentStatus]);

  const updateConsent = useCallback((updates: Partial<Omit<ConsentValue, "essential" | "version">>) => {
    setConsent((prev) => {
      const next: ConsentValue = { ...(prev ?? defaultConsent), ...updates, essential: true, version: CONSENT_VERSION };
      writeCookie(CONSENT_COOKIE_NAME, serializeConsentCookie(next));
      const allGranted = next.functional && next.analytics && next.marketing;
      writeCookie(LEGACY_CONSENT_COOKIE_NAME, allGranted ? "accepted" : "declined");
      pushConsentModeUpdate(next);
      return next;
    });
    setShowDialog(false);
  }, []);

  const acceptAll = useCallback(() => {
    updateConsent({ functional: true, analytics: true, marketing: true });
  }, [updateConsent]);

  const declineAll = useCallback(() => {
    updateConsent({ functional: false, analytics: false, marketing: false });
  }, [updateConsent]);

  const reopenSettings = useCallback(() => setShowDialog(true), []);
  const closeDialog = useCallback(() => setShowDialog(false), []);

  return (
    <ConsentContext.Provider
      value={{ consent, showDialog, updateConsent, acceptAll, declineAll, reopenSettings, closeDialog }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
