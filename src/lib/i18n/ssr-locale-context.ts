import { AsyncLocalStorage } from "node:async_hooks";
import { setSsrLocaleResolver } from "@/api/apiMiddleware";

const ssrLocaleStorage = new AsyncLocalStorage<string>();

export function getSsrLocale(): string | undefined {
  return ssrLocaleStorage.getStore();
}

// Registers this module's getter with apiMiddleware.ts as soon as this
// (server-only) module is first imported — i.e. from the first page's
// getServerSideProps that calls runWithSsrLocale. apiMiddleware.ts never
// imports this file directly (see the comment there) to keep node:async_hooks
// out of the browser bundle.
setSsrLocaleResolver(getSsrLocale);

/**
 * apiMiddleware.ts's axios client is a module-level singleton shared by every
 * concurrent SSR request, so a plain mutable variable for "the current
 * request's locale" would race across requests. AsyncLocalStorage scopes the
 * value to just the async call chain started by `run()`, which is exactly
 * one request's getServerSideProps and everything it awaits.
 */
export function runWithSsrLocale<T>(lang: string, fn: () => Promise<T>): Promise<T> {
  return ssrLocaleStorage.run(lang, fn);
}
