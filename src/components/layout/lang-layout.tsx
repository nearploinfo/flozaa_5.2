import { Suspense, useEffect, type ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader } from "@/components/layout/loader";
import { AppShellGate } from "@/components/layout/app-shell-gate";
import { AppBootstrap } from "@/components/layout/app-bootstrap";
import { AuthModal } from "@/components/auth/auth-modal";
import { HtmlLangSync } from "@/components/layout/html-lang-sync";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { CartMiniBar } from "@/components/layout/cart-mini-bar";
import { NoInternetView } from "@/components/common/no-internet-view";
import { MaintenanceMode, useMaintenanceMode } from "@/components/layout/maintenance-mode";
import { PwaInstallPrompt } from "@/components/layout/pwa-install-prompt";
import { TopProgressBar } from "@/components/layout/top-progress-bar";
import { CookieConsentDialog } from "@/components/layout/cookie-consent-dialog";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/site-config";
import { TranslationProvider } from "@/lib/i18n/translation-context";
import { getBaseDictionary } from "@/lib/i18n/base-dictionary";
import { useClientTranslation } from "@/lib/i18n/use-client-translation";
import { useOnlineStatus } from "@/lib/use-online-status";
import { setDefaultLocaleSignal } from "@/lib/i18n/default-locale-signal";
import type { TranslationPageProps } from "@/lib/i18n/page-props";

export function LangLayout({
  children,
  translation,
  lang,
}: {
  children: ReactNode;
  translation: TranslationPageProps | null;
  lang: string | undefined;
}) {
  // SEO=true: translation comes from getServerSideProps, already resolved.
  // SEO=false: no server-fetched translation exists — resolve it
  // client-side from the real browser-URL lang once mounted.
  const clientTranslation = useClientTranslation(translation ? undefined : lang);
  const resolved = translation ?? clientTranslation;

  const baseDictionary = getBaseDictionary();
  const t: TranslationPageProps =
    resolved ?? {
      dictionary: baseDictionary,
      baseDictionary,
      lang: lang ?? "en",
      isRtl: false,
      languages: [],
      defaultLocale: "en",
    };

  useEffect(() => {
    setDefaultLocaleSignal(t.defaultLocale);
  }, [t.defaultLocale]);

  const isOffline = useOnlineStatus();
  const isMaintenanceMode = useMaintenanceMode();

  return (
    <TranslationProvider
      dictionary={t.dictionary}
      baseDictionary={t.baseDictionary}
      lang={t.lang}
      isRtl={t.isRtl}
      languages={t.languages}
      defaultLocale={t.defaultLocale}
    >
      <HtmlLangSync lang={t.lang} isRtl={t.isRtl} />
      <TopProgressBar />
      <CookieConsentDialog />
      <Toaster position="bottom-right" />
      <Suspense fallback={<Loader />}>
        <AppBootstrap />
        <AuthModal />
        <AppShellGate>
          {isMaintenanceMode ? (
            <main className="app-main flex flex-1 min-h-screen items-center justify-center">
              <MaintenanceMode />
            </main>
          ) : (
            <>
              <Header />
              <main className="app-main flex-1 pb-16 xl:pb-0 min-h-screen">
                {isOffline ? (
                  <NoInternetView onRetry={() => window.location.reload()} />
                ) : (
                  children
                )}
              </main>
              <Footer />
              <CartMiniBar />
              <BottomNavigation />
              {siteConfig.pwaEnabled && <PwaInstallPrompt />}
            </>
          )}
        </AppShellGate>
      </Suspense>
    </TranslationProvider>
  );
}
