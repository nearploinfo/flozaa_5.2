// Default locale (admin-configured, from useTranslation().defaultLocale —
// NOT the static fallback in lib/i18n/locales.ts) stays bare in every URL
// (proxy.ts/[lang] rewrite it invisibly server-side, htaccess does the same
// for static export) — any other locale gets a real "/xx" prefix so it's a
// distinct, bookmarkable URL. Every place that builds a locale-aware href
// must go through this, not string-template `/${lang}${path}` directly, or
// the default locale leaks into the URL bar on click even though the
// server never shows it.
export function localizePath(path: string, lang: string, defaultLocale: string): string {
  if (lang === defaultLocale) return path;
  return `/${lang}${path}`;
}
