"use client";

import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Languages, Newspaper, Pencil, User as UserIcon, FileText, Headphones, KeyRound, Trash2, ChevronRight, TriangleAlert } from "lucide-react";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { DeleteAccountSheet } from "@/components/account/delete-account-sheet";
import { AppButton } from "@/components/ui/app-button";
import { ShareModal } from "@/components/ui/share-modal";
import {
  ChevronRightIcon,
  AccountNotificationsIcon,
  AccountBookmarksIcon,
  AccountAddressesIcon,
  PaymentHistoryIcon,
  StarIcon,
  ShareIcon,
  MoonIcon,
  LogoutMenuIcon,
  BrochureIcon,
} from "@/components/icons/icons";
import { useCustomPages } from "@/lib/use-custom-pages";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/auth-slice";
import { openAuthModal } from "@/store/slices/auth-modal-slice";
import { logoutApi } from "@/api/apiRoutes";
import { signOutFirebase } from "@/lib/firebase";
import { localizePath } from "@/lib/i18n/locale-path";
import { useLoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { useIsDarkMode } from "@/lib/use-is-dark-mode";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import becomeProviderImage from "@/assets/becomeProviderImg.png";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface RowConfig {
  key: string;
  icon: IconComponent;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  wrapper?: (children: ReactNode) => ReactNode;
}

function RowItem({ row }: { row: RowConfig }) {
  const inner = (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
        <row.icon className="size-5" />
      </span>
      <span className="flex-1 text-start text-sm font-medium text-text-primary">{row.label}</span>
      {row.trailing ?? <ChevronRightIcon className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />}
    </div>
  );

  let content: ReactNode;
  if (row.onClick) {
    content = (
      <button type="button" onClick={row.onClick} className="w-full">
        {inner}
      </button>
    );
  } else if (row.external && row.href) {
    content = (
      <a href={row.href} target="_blank" rel="noopener noreferrer" className="block w-full">
        {inner}
      </a>
    );
  } else if (row.href) {
    content = (
      <Link href={row.href} className="block w-full">
        {inner}
      </Link>
    );
  } else {
    content = <div className="w-full">{inner}</div>;
  }

  return <>{row.wrapper ? row.wrapper(content) : content}</>;
}

function SectionCard({ title, rows }: { title?: string; rows: RowConfig[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-3xl bg-bg-primary p-4">
      {title && (
        <p className="mb-3 border-b border-border-default pb-3 text-base font-semibold text-text-primary">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <RowItem key={row.key} row={row} />
        ))}
      </div>
    </div>
  );
}

function DarkModeSwitch() {
  const isDark = useIsDarkMode();

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("edemand-theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        isDark ? "bg-bg-brand" : "bg-bg-secondary"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-bg-primary shadow transition-transform",
          isDark ? "translate-x-0.3" : "-translate-x-5.5"
        )}
      />
    </button>
  );
}

const MobileAccountPage = () => {
  const { t, lang, defaultLocale, languages } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const hasHydrated = useHasHydrated();
  const user = useAppSelector((state) => state.auth.user);
  const isLoggedIn = Boolean(hasHydrated && user);
  const loginSettings = useLoginSettings();

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const [legalMenuOpen, setLegalMenuOpen] = useState(false);

  // Account is the mobile/tablet equivalent of the desktop /profile +
  // AccountSidebar layout — send true desktop viewers there instead of
  // rendering this page twice. The app shell (bottom nav, this page) stays
  // up through xl(1200) — matches the site's real lg/xl breakpoint tokens.
  useEffect(() => {
    if (window.innerWidth >= 1200) {
      router.replace(localizePath("/profile", lang, defaultLocale));
    }
  }, [lang, defaultLocale, router]);

  const displayName = user?.username || user?.email || user?.phone || "";
  const secondaryLine = user?.mobile
    ? `${user.country_code ? `${user.country_code} ` : ""}${user.phone}`
    : user?.email;
  const initial = displayName?.trim().charAt(0).toUpperCase() || "?";

  const { pages: customPages } = useCustomPages();

  const currentLanguage = languages.find((language) => language.code === lang);
  const currentLangLabel = lang === "en" ? "Eng" : (currentLanguage?.name ?? lang);

  const handleLogout = async () => {
    logoutApi().catch(() => { });
    signOutFirebase();
    dispatch(clearAuth());
    toast.success(t("header.logoutSuccess"));
    setLogoutConfirmOpen(false);
  };

  const quickActionRows: RowConfig[] = [
    ...(isLoggedIn
      ? [
        { key: "notifications", icon: AccountNotificationsIcon, label: t("nav.notifications"), href: "/notifications" },
        { key: "bookmarks", icon: AccountBookmarksIcon, label: t("nav.bookmarks"), href: "/bookmarks" },
        { key: "addresses", icon: AccountAddressesIcon, label: t("nav.addresses"), href: "/addresses" },
      ]
      : []),
    { key: "blogs", icon: Newspaper, label: t("nav.blogs"), href: "/blogs" },
    ...(isLoggedIn
      ? [{ key: "paymentHistory", icon: PaymentHistoryIcon, label: t("nav.paymentHistory"), href: "/payment-history" }]
      : []),
  ];

  const preferenceRows: RowConfig[] = [
    {
      key: "language",
      icon: Languages,
      label: t("account.menu.language"),
      href: "/language",
      trailing: (
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          {currentLangLabel}
          <ChevronRightIcon className="size-4 shrink-0 rtl:rotate-180" />
        </span>
      ),
    },
    {
      key: "darkMode",
      icon: MoonIcon,
      label: t("account.menu.darkMode"),
      trailing: <DarkModeSwitch />,
    },
  ];

  const otherRows: RowConfig[] = [
    {
      key: "rateUs",
      icon: StarIcon,
      label: t("account.menu.rateUs"),
      href: "https://play.google.com",
      external: true,
    },
    {
      key: "shareApp",
      icon: ShareIcon,
      label: t("account.menu.shareApp"),
      onClick: () => setShareOpen(true),
    },
  ];

  const supportRow: RowConfig = {
    key: "supportHelp",
    icon: Headphones,
    label: t("account.menu.supportHelp"),
    onClick: () => setSupportMenuOpen(true),
  };

  const legalRow: RowConfig = {
    key: "legalInformation",
    icon: FileText,
    label: t("account.menu.legalInformation"),
    onClick: () => setLegalMenuOpen(true),
  };

  const accountRows: RowConfig[] = isLoggedIn
    ? [
      { key: "myAccount", icon: UserIcon, label: t("account.menu.myAccount"), onClick: () => setAccountMenuOpen(true) },
      { key: "logoutFromApp", icon: LogoutMenuIcon, label: t("account.menu.logoutFromApp"), onClick: () => setLogoutConfirmOpen(true) },
    ]
    : [];

  return (
    <>
      {/* Mobile only */}
      <div className="min-h-screen bg-bg-secondary pb-24 xl:hidden">
        <nav className="mb-4 flex h-14 items-center border-b border-border-default bg-bg-primary">
          <div className="container">
            <h1 className="text-lg font-semibold text-text-primary">{t("account.myProfile")}</h1>
          </div>
        </nav>
        <div className="container">
          {isLoggedIn ? (
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-bg-primary px-4 py-4">
              <Avatar className="size-12 shrink-0">
                {user?.image && <AvatarImage src={user.image} alt={displayName} />}
                <AvatarFallback className="bg-bg-brand text-lg font-semibold text-icon-inverse">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-text-primary">{displayName}</p>
                {secondaryLine && <p className="truncate text-sm text-text-secondary">{secondaryLine}</p>}
              </div>
              <Link
                href="/profile"
                className="flex shrink-0 items-center gap-1 rounded-lg bg-bg-primary px-3 py-2 text-xs font-medium text-text-primary"
              >
                {t("account.profile.edit")} <Pencil className="size-3" />
              </Link>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-3 rounded-3xl bg-bg-primary p-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                <UserIcon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-text-primary">{t("account.menu.guest")}</p>
                <p className="text-sm text-text-secondary">{t("account.menu.guestDescription")}</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(openAuthModal("signin"))}
                className="shrink-0 whitespace-nowrap rounded-full bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary"
              >
                {t("header.login")}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5 container">
          <SectionCard title={t("account.menu.quickAction")} rows={quickActionRows} />
          <SectionCard title={t("account.menu.preferences")} rows={preferenceRows} />
          <SectionCard title={t("account.menu.other")} rows={otherRows} />
          <SectionCard rows={[supportRow]} />
          <SectionCard rows={[legalRow]} />
          {accountRows.map((row) => (
            <SectionCard key={row.key} rows={[row]} />
          ))}

          <Link
            href="/become-provider"
            className="flex items-end justify-between overflow-hidden rounded-3xl bg-bg-primary max-[380px]:flex-col"
          >
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2 p-4">
              <p className="text-base font-semibold text-text-primary">{t("nav.becomeProvider")}</p>
              <p className="text-sm text-text-secondary">{t("account.becomeProvider.description")}</p>
              <span className="mt-1 rounded-full bg-button-primary-bg px-5 py-2 text-sm font-medium text-button-primary-text">
                {t("account.becomeProvider.cta")}
              </span>
            </div>
            <AppImage
              src={becomeProviderImage}
              alt={t("nav.becomeProvider")}
              className="h-auto w-44 shrink-0 object-contain"
            />
          </Link>
        </div>
      </div>

      {/* Desktop fallback while the redirect above kicks in */}
      <div className="container commonPY hidden xl:block">
        <div className="rounded-2xl bg-bg-primary p-6">
          <h1 className="mb-4 text-lg font-semibold text-text-primary">{t("account.myProfile")}</h1>
        </div>
      </div>

      <Drawer open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DrawerContent className="bg-bg-primary">
          <DrawerTitle className="sr-only">{t("header.logoutConfirmTitle")}</DrawerTitle>

          <div className="flex flex-col items-center gap-4 px-4 pb-4">
            <span className="flex size-12 items-center justify-center rounded-3xl bg-bg-error-subtle">
              <TriangleAlert className="size-6 text-icon-error" />
            </span>

            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-sm font-semibold text-text-primary">
                {t("header.logoutConfirmTitle")}
              </span>
              <p className="text-xs font-medium text-text-secondary">
                {t("header.logoutConfirmDescription")}
              </p>
            </div>

            <div className="flex w-full items-start gap-3">
              <AppButton
                variant="primary-outline"
                size="md"
                className="flex-1 justify-center border-border-error bg-bg-error-subtle text-text-error"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                {t("common.close")}
              </AppButton>
              <AppButton
                variant="primary"
                size="md"
                className="flex-1 justify-center bg-button-destructive-bg text-button-destructive-text hover:bg-button-destructive-hover"
                onClick={handleLogout}
              >
                {t("header.logout")}
              </AppButton>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <DeleteAccountSheet open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={typeof window !== "undefined" ? window.location.origin : ""}
        title={siteConfig.title}
      />

      {/* Account Options Full-Page Modal */}
      {accountMenuOpen && (
        <div className="fixed inset-0 z-50 animate-in slide-in-from-right-full bg-bg-secondary duration-300 xl:hidden">
          {/* Nav Bar */}
          <nav className="flex h-14 items-center gap-3 border-b border-border-default bg-bg-primary px-4">
            <button
              type="button"
              onClick={() => setAccountMenuOpen(false)}
              className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-icon-secondary transition-colors hover:bg-bg-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text-primary">{t("account.menu.myAccount")}</h1>
          </nav>

          {/* Content */}
          <div className="space-y-3 p-4 pt-5">
            {/* Change Password — hidden for Google accounts, and when password login is off */}
            {user?.login_type !== "google" && loginSettings.customer_password_login_enabled && (
              <div className="rounded-3xl bg-bg-primary p-4">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    router.push(localizePath("/change-password", lang, defaultLocale));
                  }}
                  className="flex w-full items-center gap-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                    <KeyRound className="size-5" />
                  </span>
                  <span className="flex-1 text-start text-sm font-medium text-text-primary">
                    {t("account.sidebar.changePassword")}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
                </button>
              </div>
            )}

            {/* Delete Account */}
            <div className="rounded-3xl bg-bg-primary p-4">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen(false);
                  setDeleteAccountOpen(true);
                }}
                className="flex w-full items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
                  <Trash2 className="size-5 text-red-500" />
                </span>
                <span className="flex-1 text-start text-sm font-medium text-red-500">
                  {t("account.sidebar.deleteAccount")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-red-400 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support & Help Full-Page Modal */}
      {supportMenuOpen && (
        <div className="fixed inset-0 z-50 animate-in slide-in-from-right-full bg-bg-secondary duration-300 xl:hidden">
          {/* Nav Bar */}
          <nav className="flex h-14 items-center gap-3 border-b border-border-default bg-bg-primary px-4">
            <button
              type="button"
              onClick={() => setSupportMenuOpen(false)}
              className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-icon-secondary transition-colors hover:bg-bg-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text-primary">{t("account.menu.supportHelp")}</h1>
          </nav>

          {/* Content */}
          <div className="space-y-3 p-4 pt-5">
            {/* Customer Support */}
            <div className="rounded-3xl bg-bg-primary p-4">
              <button
                type="button"
                onClick={() => {
                  setSupportMenuOpen(false);
                  router.push(localizePath("/chats/admin", lang, defaultLocale));
                }}
                className="flex w-full items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                  <Headphones className="size-5" />
                </span>
                <span className="flex-1 text-start text-sm font-medium text-text-primary">
                  {t("account.sidebar.customerSupport")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
              </button>
            </div>

            {/* FAQs */}
            <div className="rounded-3xl bg-bg-primary p-4">
              <button
                type="button"
                onClick={() => {
                  setSupportMenuOpen(false);
                  router.push(localizePath("/faqs", lang, defaultLocale));
                }}
                className="flex w-full items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </span>
                <span className="flex-1 text-start text-sm font-medium text-text-primary">
                  {t("nav.faqs")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
              </button>
            </div>

            {/* Contact Us */}
            <div className="rounded-3xl bg-bg-primary p-4">
              <button
                type="button"
                onClick={() => {
                  setSupportMenuOpen(false);
                  router.push(localizePath("/contact-us", lang, defaultLocale));
                }}
                className="flex w-full items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 6.29 6.29l1.08-1.08a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <span className="flex-1 text-start text-sm font-medium text-text-primary">
                  {t("nav.contactUs")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal & Information Full-Page Modal */}
      {legalMenuOpen && (
        <div className="fixed inset-0 z-50 animate-in slide-in-from-right-full bg-bg-secondary duration-300 xl:hidden">
          {/* Nav Bar */}
          <nav className="flex h-14 items-center gap-3 border-b border-border-default bg-bg-primary px-4">
            <button
              type="button"
              onClick={() => setLegalMenuOpen(false)}
              className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-icon-secondary transition-colors hover:bg-bg-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text-primary">{t("account.menu.legalInformation")}</h1>
          </nav>

          {/* Content */}
          <div className="space-y-3 p-4 pt-5">
            {/* About Us */}
            <div className="rounded-3xl bg-bg-primary p-4">
              <button
                type="button"
                onClick={() => {
                  setLegalMenuOpen(false);
                  router.push(localizePath("/about-us", lang, defaultLocale));
                }}
                className="flex w-full items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </span>
                <span className="flex-1 text-start text-sm font-medium text-text-primary">
                  {t("nav.aboutUs")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
              </button>
            </div>

            {/* Privacy Policy */}
            <div className="rounded-3xl bg-bg-primary p-4">
              <button
                type="button"
                onClick={() => {
                  setLegalMenuOpen(false);
                  router.push(localizePath("/privacy-policy", lang, defaultLocale));
                }}
                className="flex w-full items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span className="flex-1 text-start text-sm font-medium text-text-primary">
                  {t("nav.privacyPolicy")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
              </button>
            </div>

            {/* Terms & Conditions */}
            <div className="rounded-3xl bg-bg-primary p-4">
              <button
                type="button"
                onClick={() => {
                  setLegalMenuOpen(false);
                  router.push(localizePath("/terms-and-conditions", lang, defaultLocale));
                }}
                className="flex w-full items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                  <FileText className="size-5" />
                </span>
                <span className="flex-1 text-start text-sm font-medium text-text-primary">
                  {t("nav.termsAndConditions")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
              </button>
            </div>

            {/* Admin-created custom pages — desktop shows these in the footer,
             * which is hidden on mobile (max-xl:hidden), so this is the only
             * place they're reachable here. */}
            {customPages.map((page) => (
              <div key={page.slug} className="rounded-3xl bg-bg-primary p-4">
                <button
                  type="button"
                  onClick={() => {
                    setLegalMenuOpen(false);
                    router.push(localizePath(`/custom-page/${page.slug}`, lang, defaultLocale));
                  }}
                  className="flex w-full items-center gap-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary">
                    <BrochureIcon className="size-5" />
                  </span>
                  <span className="flex-1 text-start text-sm font-medium text-text-primary">{page.title}</span>
                  <ChevronRight className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileAccountPage;