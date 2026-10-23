import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchDefaultLocale } from "@/lib/i18n/language-list";

// This only needs a coarse "does this path already look locale-prefixed"
// check; the real, authoritative check is each page's getServerSideProps
// (via getTranslationProps) against the actual fetched list, which still
// 404s an invalid code that slips through here.
const LOCALE_SEGMENT_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

function getLocale(request: NextRequest, apiDefaultLocale: string): string {
  const cookieLocale = request.cookies.get("edemand-lang")?.value;
  if (cookieLocale && LOCALE_SEGMENT_PATTERN.test(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim();
    if (preferred && LOCALE_SEGMENT_PATTERN.test(preferred)) {
      return preferred;
    }
  }

  return apiDefaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1] ?? "";
  const pathnameHasLocale = LOCALE_SEGMENT_PATTERN.test(firstSegment);
  if (pathnameHasLocale) return NextResponse.next();

  // Proxy runs in the Node.js runtime (Next 16 default) — the module-level
  // TTL cache in language-list.ts persists here across requests, so this
  // is a real network call at most once per hour, not per request.
  const apiDefaultLocale = await fetchDefaultLocale();
  const locale = getLocale(request, apiDefaultLocale);

  // Default locale (admin-configured, from the API) stays invisible in the
  // URL — but a bare URL is now a REAL page (see pages/** — the
  // scripts/generate-locale-wrappers.mjs-generated mirror of pages/[lang]/**),
  // not just an Apache/middleware rewrite target, so there's nothing to do
  // here: Next already routes it straight to that page, and the page's own
  // getServerSideProps resolves the current default locale itself. A
  // middleware *rewrite* here would make the URL invisible to the CLIENT
  // router too, breaking soft navigation (the exact bug this setup exists
  // to avoid) — that's why this only still redirects the other case below.
  if (locale === apiDefaultLocale) {
    return NextResponse.next();
  }

  // A non-default locale (cookie or Accept-Language pointed elsewhere) is a
  // real distinct page — redirect visibly to its "/xx" URL.
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|icon.png|icon.svg|apple-icon.png|manifest.json|sw.js|sitemap.xml|sitemap.xsl).*)",
  ],
};
