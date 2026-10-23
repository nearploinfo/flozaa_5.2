import { getLanguageListApi, getLanguageJsonDataApi } from "@/api/apiRoutes";
import { deepMerge } from "@/lib/deep-merge";
import enDictionary from "@/dictionaries/en.json";
import type { LanguageListItem } from "@/lib/i18n/language-list";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface LanguageListApiItem {
  code: string;
  language: string;
  is_rtl: string;
  image?: string;
}

interface LanguageListClientResponse {
  error?: boolean;
  data?: LanguageListApiItem[];
  default_language?: LanguageListApiItem;
}

const FALLBACK_LANGUAGES: LanguageListItem[] = [{ code: "en", name: "English", isRtl: false }];
const FALLBACK_DEFAULT_LOCALE = "en";

// Client-safe counterparts of fetchLanguageList/getDictionary — those two
// use a server-process TTL cache that has no meaning in the browser. Used
// only by useClientTranslation (SEO=false pages have no server-fetched
// translation, so the browser must resolve it itself after hydration).
export async function fetchLanguageListClient(): Promise<{
  languages: LanguageListItem[];
  defaultLocale: string;
}> {
  try {
    const response: LanguageListClientResponse = await getLanguageListApi({ platform: "web" });
    if (!response?.data?.length) {
      return { languages: FALLBACK_LANGUAGES, defaultLocale: FALLBACK_DEFAULT_LOCALE };
    }
    const languages = response.data.map((item: LanguageListApiItem) => ({
      code: item.code,
      name: item.language,
      isRtl: item.is_rtl === "1",
      image: item.image,
    }));
    const defaultLocale = response.default_language?.code ?? languages[0]?.code ?? FALLBACK_DEFAULT_LOCALE;
    return { languages, defaultLocale };
  } catch {
    return { languages: FALLBACK_LANGUAGES, defaultLocale: FALLBACK_DEFAULT_LOCALE };
  }
}

export async function getDictionaryClient(locale: string): Promise<Dictionary> {
  if (locale === "en") return enDictionary;
  try {
    const remote = await getLanguageJsonDataApi({ language_code: locale, platform: "web" });
    if (!remote?.data) return enDictionary;
    return deepMerge(enDictionary, remote.data) as Dictionary;
  } catch {
    return enDictionary;
  }
}
