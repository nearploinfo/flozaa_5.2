"use client";

import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import logo from "@/assets/brand/logo.svg";
import whiteLogo from "@/assets/brand/white_logo.svg";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HeaderSearch } from "@/components/layout/header-search";
import { LocationPicker } from "@/components/layout/location-picker";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Navigation } from "@/components/layout/navigation";
import { AppButton } from "@/components/ui/app-button";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRequireAuth } from "@/lib/use-require-auth";
import { openAuthModal } from "@/store/slices/auth-modal-slice";
import { useIsDarkMode } from "@/lib/use-is-dark-mode";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { siteConfig } from "@/lib/site-config";

interface HeaderLogoSettings {
  web_logo?: string;
  footer_logo?: string;
}

export function Header() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useRequireAuth();
  const isDark = useIsDarkMode();
  const hasHydrated = useHasHydrated();
  const webSettings = useAppSelector((state) => state.settings.data?.web_settings) as
    | HeaderLogoSettings
    | undefined;
  // redux-persist rehydrates webSettings synchronously before the first
  // client render, but SSR never has it — gate on hasHydrated so that first
  // client render matches the server (static logo) and avoids a hydration
  // mismatch; the real logo swaps in a tick later.
  const headerLogo = isDark
    ? (hasHydrated && webSettings?.footer_logo) || whiteLogo
    : (hasHydrated && webSettings?.web_logo) || logo;
  return (
    <>
      {/*
        Mobile Figma ("eDemand Customer") is a distinct app-style header, not
        a reflow of the desktop one — rendered as a fully separate tree rather
        than fighting one layout with breakpoint modifiers.
        TODO: mobile hamburger/secondary-nav (About, Pages, language, theme)
        has no home in this design yet — dropped from the mobile view for now,
        pending a mobile "menu"/"more" screen from Figma.
      */}
      <MobileHeader />

      <header className="hidden bg-bg-primary shadow-[0px_2px_14px_0px_rgba(0,0,0,0.06)] xl:block">
        <div className="border-b border-border-default py-4 lg:py-6">
          <div className="container flex items-center gap-6">
            <div className="flex flex-1 items-center gap-4 lg:gap-6">
              <Link href="/" className="flex shrink-0 items-center">
                <AppImage
                  src={headerLogo}
                  alt={siteConfig.appName}
                  priority
                  className="h-9 w-auto lg:h-11"
                />
              </Link>

              <div className="flex flex-1 items-center gap-4">
                <LocationPicker />
                <HeaderSearch />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <ThemeToggle />

              <LanguageSwitcher />

              <div className="hidden h-10 w-px bg-border-default md:block" />

              {isLoggedIn ? (
                <ProfileMenu />
              ) : (
                <AppButton variant="primary" size="md" onClick={() => dispatch(openAuthModal("signin"))}>
                  {t("header.login")}
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </header>

      <Navigation />
    </>
  );
}
