export const CONSENT_COOKIE_NAME = "gdpr-consent-v2";
export const LEGACY_CONSENT_COOKIE_NAME = "cookie-consent";
const EXPIRY_DAYS = 365;

// Bump whenever consent purposes change materially (new vendor, new
// category, new data transfer) — users on an older version get re-prompted.
export const CONSENT_VERSION = 1;

export interface ConsentValue {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  version: number;
}

export const defaultConsent: ConsentValue = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
};

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${EXPIRY_DAYS * 24 * 60 * 60}; SameSite=Lax`;
}

export function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function parseConsentCookie(raw: string | undefined): ConsentValue | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...defaultConsent, ...parsed, essential: true };
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeConsentCookie(value: ConsentValue): string {
  return JSON.stringify(value);
}
