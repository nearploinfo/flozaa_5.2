import { useEffect, useState } from "react";
import enDictionary from "@/dictionaries/en.json";
import { fetchLanguageListClient, getDictionaryClient } from "@/lib/i18n/client-translation";
import type { TranslationPageProps } from "@/lib/i18n/page-props";

// SEO=false pages render with no server-fetched translation (that's the
// whole point — no getServerSideProps means Automatic Static
// Optimization, which is what gives us the shared out/[lang]/ build).
// This hook resolves the real dictionary/language list client-side once
// the real `lang` is known from the browser URL.
export function useClientTranslation(lang: string | undefined): TranslationPageProps | null {
  const [translation, setTranslation] = useState<TranslationPageProps | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { languages, defaultLocale } = await fetchLanguageListClient();
      // No `lang` means this is the bare (unprefixed) default-locale URL —
      // there's no [lang] segment in that route's pattern for router.query
      // to ever populate, so fall back to the fetched default rather than
      // skipping the whole fetch (see localizePath — bare URL always means
      // the default locale).
      const effectiveLang = lang ?? defaultLocale;
      const language = languages.find((item) => item.code === effectiveLang) ?? languages[0];
      const dictionary = await getDictionaryClient(effectiveLang);
      if (cancelled) return;
      setTranslation({
        dictionary,
        baseDictionary: enDictionary,
        lang: effectiveLang,
        isRtl: language?.isRtl ?? false,
        languages,
        defaultLocale,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return translation;
}
