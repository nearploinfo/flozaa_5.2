import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";
import { ErudaConsole } from "@/components/dev/eruda-console";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { LangLayout } from "@/components/layout/lang-layout";
import { ConsentScripts } from "@/components/layout/consent-scripts";
import { QueryProvider } from "@/lib/query-provider";
import { ConsentProvider } from "@/lib/consent-context";
import { StoreProvider } from "@/store/provider";
import { initChunkErrorRecovery } from "@/lib/chunk-error-recovery";
import { initBuildFreshnessCheck } from "@/lib/build-freshness";
import { logClarityEvent } from "@/lib/analytics/clarity-events";
import { APP_LIFECYCLE_EVENTS } from "@/lib/analytics/clarity-event-names";
import { siteConfig } from "@/lib/site-config";
import type { TranslationPageProps } from "@/lib/i18n/page-props";

interface LangPageProps {
  translation?: TranslationPageProps | null;
}

export default function App({ Component, pageProps }: AppProps<LangPageProps>) {
  const router = useRouter();
  const isLangScoped = router.pathname !== "/404" && router.pathname !== "/_error";
  const { translation, ...rest } = pageProps;

  useEffect(() => {
    logClarityEvent(APP_LIFECYCLE_EVENTS.APP_LAUNCH, { path: window.location.pathname, route: router.pathname });
  }, [router.pathname]);

  // Runs once for the tab's lifetime — not per navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => initChunkErrorRecovery(router), []);

  // Same lifetime scope — silently reloads the tab once a newer build has
  // deployed, so a tab left open across a deploy self-heals instead of
  // running stale client code indefinitely (see build-freshness.ts).
  useEffect(() => initBuildFreshnessCheck(), []);

  useEffect(() => {
    function handleVisibilityChange() {
      logClarityEvent(
        document.visibilityState === "visible" ? APP_LIFECYCLE_EVENTS.APP_RESUME : APP_LIFECYCLE_EVENTS.APP_BACKGROUND,
        { path: window.location.pathname, route: router.pathname }
      );
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router.pathname]);

  // Key on the path only, not the full asPath — asPath includes the query
  // string, and pages that reflect filter/search/sort/page state as query
  // params (via router.replace) would otherwise remount entirely (losing
  // local state) on every such change. Keying on the pathname still resets
  // the boundary on real navigation, including dynamic segments.
  const pathOnly = router.asPath.split("?")[0].split("#")[0];
  const body = isLangScoped ? (
    <LangLayout translation={translation ?? null} lang={router.query.lang as string | undefined}>
      <ErrorBoundary key={pathOnly}>
        <Component {...rest} />
      </ErrorBoundary>
    </LangLayout>
  ) : (
    <Component {...rest} />
  );

  return (
    <>
      {/* Site-wide default — matches the App Router root layout's static
          `metadata` export (no page ever overrode it with its own
          generateMetadata; next/head on an individual page would still
          take precedence here since Next merges by rendering order). */}
      <Head>
        <title>{siteConfig.title}</title>
        <meta name="description" content={siteConfig.description} />
        <meta name="keywords" content={siteConfig.keywords.join(", ")} />
      </Head>
      {/* Opt-in only — real-phone/LAN debugging session, not every local dev run.
          NODE_ENV==="development" alone used to gate this, so it launched
          (and its floating gear button showed) on every `next dev` session
          whether anyone needed the console or not. */}
      {process.env.NEXT_PUBLIC_ENABLE_DEV_CONSOLE === "true" && <ErudaConsole />}
      {/* Only the demo deploy gets tracked — stage/prod/other environments opt out. */}
      {siteConfig.environment === "demo" && <Analytics />}
      <StoreProvider>
        <ConsentProvider>
          <ConsentScripts />
          <QueryProvider>{body}</QueryProvider>
        </ConsentProvider>
      </StoreProvider>
    </>
  );
}
