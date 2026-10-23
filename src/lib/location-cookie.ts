export const LOCATION_COOKIE_NAME = "edemand-loc";

export interface LocationCookieValue {
  address: string;
  lat: number;
  lng: number;
}

export function serializeLocationCookie(value: LocationCookieValue): string {
  return encodeURIComponent(JSON.stringify(value));
}

export function readLocationCookieFromDocument(): LocationCookieValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCATION_COOKIE_NAME}=([^;]*)`));
  return parseLocationCookie(match?.[1]);
}

/** SSR shorthand: the saved location as the `{ lat, lng }` shape the
 * country-scoped APIs (get_seo_settings, get_page_setting, …) take, read
 * straight off the request's cookies. null when no location is set yet, which
 * those APIs treat as "fall back to the default country". */
export function coordsFromCookies(
  cookies: Partial<Record<string, string>> | undefined
): { lat: number; lng: number } | null {
  const location = parseLocationCookie(cookies?.[LOCATION_COOKIE_NAME]);
  return location ? { lat: location.lat, lng: location.lng } : null;
}

export function parseLocationCookie(raw: string | undefined | null): LocationCookieValue | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      parsed &&
      typeof parsed.address === "string" &&
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
