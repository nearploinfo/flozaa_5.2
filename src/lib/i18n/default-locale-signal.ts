// Plain module-level value (not React state) so apiMiddleware.ts — a
// non-component axios interceptor with no hook access — can read the
// resolved default locale synchronously. Set once per app load by
// LangLayout once the real translation data (server or client) resolves.
// Deliberately NOT backed by a network call here: apiMiddleware.ts's
// interceptor wraps every request including getLanguageListApi itself, so
// fetching the language list from inside it would deadlock.
let cached: string | null = null;

export function setDefaultLocaleSignal(locale: string): void {
  cached = locale;
}

export function getDefaultLocaleSignal(): string | null {
  return cached;
}
