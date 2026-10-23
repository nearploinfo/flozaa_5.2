/**
 * Thin, safe wrapper around the Microsoft Clarity client SDK. Microsoft
 * Clarity injects `window.clarity` after its snippet boots — every call
 * here is guarded so it never throws on the server, during hydration, or
 * while the script is still loading.
 */

import { CONSENT_COOKIE_NAME, parseConsentCookie, readCookie } from "@/lib/cookie-consent";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const isBrowser = () => typeof window !== "undefined";

function hasAnalyticsConsent(): boolean {
  if (!isBrowser()) return false;
  return parseConsentCookie(readCookie(CONSENT_COOKIE_NAME))?.analytics === true;
}

export function isClarityReady(): boolean {
  return isBrowser() && typeof window.clarity === "function";
}

export function logClarityEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (!eventName) return;
  if (!hasAnalyticsConsent()) return;
  if (!isClarityReady()) return;

  try {
    const clarity = window.clarity as (...args: unknown[]) => void;

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      clarity("set", key, value);
    }

    clarity("event", eventName);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[clarityEvents] Failed to log "${eventName}".`, error, params);
    }
  }
}
