// Locale is admin-configured (see lib/i18n/language-list.ts) — no longer a
// fixed compile-time set. Validity is checked at runtime against the fetched
// language list (layout.tsx), not against a hardcoded union.
export type Locale = string;

export const defaultLocale: Locale = "en";
