import { getLanguageListApi } from "@/api/apiRoutes";

export interface LanguageListItem {
  code: string;
  name: string;
  isRtl: boolean;
  image?: string;
}

interface LanguageListApiItem {
  code: string;
  language: string;
  is_rtl: string;
  image?: string;
}

interface LanguageListResponse {
  error?: boolean;
  data?: LanguageListApiItem[];
  default_language?: LanguageListApiItem;
}

interface LanguageListState {
  languages: LanguageListItem[];
  defaultLocale: string;
}

const FALLBACK_STATE: LanguageListState = {
  languages: [{ code: "en", name: "English", isRtl: false }],
  defaultLocale: "en",
};
const CACHE_TTL_MS = 3600 * 1000;

let cache: { value: LanguageListState; expiresAt: number } | null = null;
let inflight: Promise<LanguageListState> | null = null;

function toLanguageListItem(item: LanguageListApiItem): LanguageListItem {
  return {
    code: item.code,
    name: item.language,
    isRtl: item.is_rtl === "1",
    image: item.image,
  };
}

async function fetchLanguageListStateUncached(): Promise<LanguageListState> {
  try {
    const response: LanguageListResponse = await getLanguageListApi({ platform: "web" });
    if (!response?.data?.length) return FALLBACK_STATE;
    const languages = response.data.map(toLanguageListItem);
    // The admin panel's configured default — not hardcoded "en". Falls
    // back to the first language in the list, then the static fallback,
    // if the API ever omits default_language.
    const defaultLocale = response.default_language?.code ?? languages[0]?.code ?? "en";
    return { languages, defaultLocale };
  } catch {
    return FALLBACK_STATE;
  }
}

// Pages Router has no unstable_cache (App-Router-only). This app's
// SEO=true mode is a long-lived standalone Node process (see
// next.config.ts), so a module-level TTL cache reproduces the same
// 1-hour cross-request sharing unstable_cache gave us, without a
// per-request backend hit. Also used by proxy.ts (Proxy defaults to the
// Node.js runtime, so this cache persists there too, not just per-request).
async function fetchLanguageListState(): Promise<LanguageListState> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  if (!inflight) {
    inflight = fetchLanguageListStateUncached().finally(() => {
      inflight = null;
    });
  }
  const value = await inflight;
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function fetchLanguageList(): Promise<LanguageListItem[]> {
  return (await fetchLanguageListState()).languages;
}

// The admin-configured default locale (API's `default_language.code`) —
// the authoritative source for "which locale stays unprefixed in the
// URL," not the static fallback in lib/i18n/locales.ts.
export async function fetchDefaultLocale(): Promise<string> {
  return (await fetchLanguageListState()).defaultLocale;
}
