"use client";

import { createContext, useContext, useMemo } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { defaultLocale, type Locale } from "@/lib/i18n/locales";
import type { LanguageListItem } from "@/lib/i18n/language-list";

interface TranslationContextValue {
  dictionary: Dictionary;
  /** Bundled `en` JSON — always available, no network call. Second link in the t() fallback chain. */
  baseDictionary: Dictionary;
  lang: Locale;
  isRtl: boolean;
  /** Admin-configured language list, fetched once server-side — lets the switcher avoid a second client fetch. */
  languages: LanguageListItem[];
  /** Admin-configured default locale (API's default_language.code) — the one that stays unprefixed in the URL. */
  defaultLocale: Locale;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({
  dictionary,
  baseDictionary,
  lang,
  isRtl = false,
  languages,
  defaultLocale: providedDefaultLocale,
  children,
}: {
  dictionary: Dictionary;
  baseDictionary: Dictionary;
  lang: Locale;
  isRtl?: boolean;
  languages: LanguageListItem[];
  defaultLocale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ dictionary, baseDictionary, lang, isRtl, languages, defaultLocale: providedDefaultLocale }),
    [dictionary, baseDictionary, lang, isRtl, languages, providedDefaultLocale]
  );
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

function resolve(dictionary: Dictionary, key: string): unknown {
  if (typeof key !== "string") return undefined;
  return key
    .split(".")
    .reduce<unknown>(
      (acc, segment) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[segment] : undefined,
      dictionary
    );
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  const dictionary = ctx?.dictionary;
  const baseDictionary = ctx?.baseDictionary;
  const lang = ctx?.lang ?? defaultLocale;
  const isRtl = ctx?.isRtl ?? false;
  const languages = ctx?.languages ?? [];
  const contextDefaultLocale = ctx?.defaultLocale ?? defaultLocale;

  const t = (key: string, vars?: Record<string, string | number>): string => {
    // Fallback chain: active locale -> bundled `en` -> raw key. Catches
    // missing/stale admin-provided translations and unbundled locales alike.
    const active = dictionary && resolve(dictionary, key);
    const value =
      typeof active === "string" ? active : baseDictionary && resolve(baseDictionary, key);
    if (typeof value !== "string") return key;
    return interpolate(value, vars);
  };

  return { t, lang, isRtl, languages, defaultLocale: contextDefaultLocale };
}
