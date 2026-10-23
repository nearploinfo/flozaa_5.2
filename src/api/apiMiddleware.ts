import axios from "axios";
import { store } from "@/store/store";
import { clearAuth } from "@/store/slices/auth-slice";
import { defaultLocale } from "@/lib/i18n/locales";
import { getDefaultLocaleSignal } from "@/lib/i18n/default-locale-signal";

function getStoredToken(): string | null {
  return store.getState().auth.token;
}

const LOCALE_SEGMENT_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

// Set by ssr-locale-context.ts (server-only, uses node:async_hooks) once it
// loads. This file is bundled for the browser too (every client-side API
// call goes through it), so it must never statically import a Node-only
// module itself — that would drag node:async_hooks into the browser chunk
// and fail the build. A resolver function set at runtime keeps this file's
// own imports client-safe while still letting SSR requests report their
// real locale.
let ssrLocaleResolver: (() => string | undefined) | null = null;
export function setSsrLocaleResolver(resolver: () => string | undefined): void {
  ssrLocaleResolver = resolver;
}

// The default locale doesn't appear in the URL at all (see localizePath) —
// only a non-default locale shows as the first path segment. Can't
// network-fetch the real default locale here: getLanguageListApi() itself
// routes through this same intercepted client, which would deadlock.
// getDefaultLocaleSignal() is a synchronous, non-network value LangLayout
// populates once real translation data resolves; the static "en" fallback
// only applies in the brief window before that first happens.
function getCurrentLanguageCode(): string {
  const fallback = getDefaultLocaleSignal() ?? defaultLocale;
  if (typeof window === "undefined") return ssrLocaleResolver?.() ?? fallback;
  const firstSegment = window.location.pathname.split("/")[1] ?? "";
  return LOCALE_SEGMENT_PATTERN.test(firstSegment) ? firstSegment : fallback;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Content-Language"] = getCurrentLanguageCode();
  config.headers["Content-Type"] = "multipart/form-data";
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(clearAuth());
      // Drop back to guest state in place — no hard navigation. A 401 can
      // come from any background call (cart, chat unread counts, settings)
      // firing alongside whatever the user is actually doing; forcing
      // window.location.href here used to blow away the current URL
      // (e.g. a /services?durations=... filter) and hard-redirect home.
      if (typeof window !== "undefined") {
        import("@/lib/firebase").then(({ signOutFirebase }) => signOutFirebase());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
