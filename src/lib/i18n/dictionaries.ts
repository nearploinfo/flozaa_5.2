import { getLanguageJsonDataApi } from "@/api/apiRoutes";
import { deepMerge } from "@/lib/deep-merge";
import type { Locale } from "@/lib/i18n/locales";
import enDictionary from "@/dictionaries/en.json";
import { getBaseDictionary, type Dictionary } from "@/lib/i18n/base-dictionary";

export type { Dictionary };
export { getBaseDictionary };

interface LanguageJsonDataResponse {
  data?: Record<string, unknown>;
}

const CACHE_TTL_MS = 3600 * 1000;
const cache = new Map<Locale, { value: Record<string, unknown> | null; expiresAt: number }>();
const inflight = new Map<Locale, Promise<Record<string, unknown> | null>>();

async function fetchRemoteDictionaryData(locale: Locale): Promise<Record<string, unknown> | null> {
  const remote: LanguageJsonDataResponse | null = await getLanguageJsonDataApi({
    language_code: locale,
    platform: "web",
  }).catch(() => null);
  return remote?.data ?? null;
}

// Same TTL-cache reasoning as fetchLanguageList — unstable_cache isn't
// available in Pages Router.
async function getRemoteDictionaryData(locale: Locale): Promise<Record<string, unknown> | null> {
  const cached = cache.get(locale);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  let pending = inflight.get(locale);
  if (!pending) {
    pending = fetchRemoteDictionaryData(locale).finally(() => inflight.delete(locale));
    inflight.set(locale, pending);
  }
  const value = await pending;
  cache.set(locale, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

// `en` is the only bundled dictionary — every other locale (including "hi")
// is admin-driven only: fetched from the backend and overlaid onto the
// bundled `en` JSON, which is the single source of truth for missing keys
// (see getBaseDictionary / translation-context's t() fallback chain).
// Only called from getServerSideProps (via getTranslationProps) — never
// imported by a client component, so the network-fetching code here never
// reaches the browser bundle.
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  if (locale === "en") return enDictionary;
  const remoteData = await getRemoteDictionaryData(locale);
  if (!remoteData) return enDictionary;
  return deepMerge(enDictionary, remoteData);
}
