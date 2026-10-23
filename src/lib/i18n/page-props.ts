import { fetchLanguageList, fetchDefaultLocale, type LanguageListItem } from "@/lib/i18n/language-list";
import { getDictionary, getBaseDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

export interface TranslationPageProps {
  dictionary: Dictionary;
  baseDictionary: Dictionary;
  lang: string;
  isRtl: boolean;
  languages: LanguageListItem[];
  defaultLocale: string;
}

// SEO=true getServerSideProps helper — every [lang]-scoped page calls this
// first. Mirrors what src/app/[lang]/layout.tsx did unconditionally in the
// App Router version, now per-page since Pages Router has no nested
// layout data fetching.
export async function getTranslationProps(lang: string): Promise<TranslationPageProps | null> {
  const [languages, defaultLocale] = await Promise.all([fetchLanguageList(), fetchDefaultLocale()]);
  const language = languages.find((item) => item.code === lang);
  if (!language) return null;
  const dictionary = await getDictionary(lang);
  const baseDictionary = getBaseDictionary();
  return { dictionary, baseDictionary, lang, isRtl: language.isRtl, languages, defaultLocale };
}
