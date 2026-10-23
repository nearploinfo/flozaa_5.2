"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { localizePath } from "@/lib/i18n/locale-path";
import { User, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/components/ui/locale-link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppButton } from "@/components/ui/app-button";
import {
  ChevronRightIcon,
  AccountBookingsIcon,
  AccountBookmarksIcon,
  AccountNotificationsIcon,
  MyServiceRequestsIcon,
  ChatsWithProvidersIcon,
  AccountAddressesIcon,
  PaymentHistoryIcon,
  QuestionMarkCircleIcon,
  LogoutMenuIcon,
} from "@/components/icons/icons";
import { AccountNavLink, AccountNavAction } from "@/components/account/account-nav-item";
import { ProfileCardSkeleton } from "@/components/account/account-skeleton";
import { logoutApi } from "@/api/apiRoutes";
import { signOutFirebase } from "@/lib/firebase";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/auth-slice";
import { useLoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useHasHydrated } from "@/lib/use-has-hydrated";

const bookingsSection = [
  { labelKey: "nav.bookings", href: "/general-bookings", icon: AccountBookingsIcon },
  { labelKey: "nav.bookmarks", href: "/bookmarks", icon: AccountBookmarksIcon },
  { labelKey: "nav.myServiceRequests", href: "/my-services-requests", icon: MyServiceRequestsIcon },
  { labelKey: "nav.notifications", href: "/notifications", icon: AccountNotificationsIcon },
  {
    labelKey: "nav.chatsWithProviders",
    href: "/chats",
    icon: ChatsWithProvidersIcon,
    // /chats/admin is the Customer Support item's own page — don't double-highlight both.
    activeWhen: (path: string) => path === "/chats" || (path.startsWith("/chats/") && !path.startsWith("/chats/admin")),
    badgeFor: "providerChats" as const,
  },
];

const accountsSection = [
  { labelKey: "nav.addresses", href: "/addresses", icon: AccountAddressesIcon },
  { labelKey: "nav.paymentHistory", href: "/payment-history", icon: PaymentHistoryIcon },
  {
    labelKey: "account.sidebar.customerSupport",
    href: "/chats/admin",
    icon: QuestionMarkCircleIcon,
    badgeFor: "supportChat" as const,
  },
];

export function AccountSidebar() {
  const { t, lang, defaultLocale } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const user = useAppSelector((state) => state.auth.user);
  const loginSettings = useLoginSettings();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const unreadCounts = useAppSelector((state) => state.chatUI.unreadCounts);
  const badgeByKey: Record<"providerChats" | "supportChat", number> = {
    providerChats: unreadCounts.pre_booking + unreadCounts.booking,
    supportChat: unreadCounts.admin,
  };

  // SSR always renders with no persisted user; wait for the client to mount
  // and redux-persist to rehydrate before showing user-dependent content, or
  // this flashes/mismatches on a hard reload (see useHasHydrated). The nav
  // rows are static (translations only), so only the profile card — the part
  // that actually depends on `user` — needs to wait/skeleton.
  if (hasHydrated && !user) return null;

  const displayName = user?.username || user?.email || user?.phone || "";
  const secondaryLine = user?.phone
    ? `${user.country_code ? `${user.country_code} ` : ""}${user.phone}`
    : user?.email;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const goHome = () => router.push(localizePath("/", lang, defaultLocale));

  const handleLogout = async () => {
    logoutApi().catch(() => {});
    signOutFirebase();
    dispatch(clearAuth());
    toast.success(t("header.logoutSuccess"));
    goHome();
  };

  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-xl border border-border-default bg-bg-primary p-6 max-xl:hidden xl:w-96">
      {hasHydrated && user ? (
        <div className="flex w-full items-center gap-4 self-stretch rounded-xl border border-border-default bg-bg-secondary p-3">
          <div className="flex items-center justify-start rounded-full border border-border-black p-1">
            <Avatar className="size-14">
              {user.image && <AvatarImage src={user.image} alt={displayName} />}
              <AvatarFallback className="bg-bg-brand text-lg font-medium text-icon-inverse">
                {initial || <User className="size-6" />}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="line-clamp-1 w-full text-base font-semibold text-text-primary">{displayName}</span>
            {secondaryLine && (
              <span className="line-clamp-1 w-full text-sm text-text-secondary">{secondaryLine}</span>
            )}
          </div>
          <Link
            href="/profile"
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-button-link-secondary-text hover:bg-accent"
          >
            <ChevronRightIcon className="size-5 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <ProfileCardSkeleton />
      )}

      <div className="flex w-full flex-col items-start gap-3">
        <p className="w-full text-base text-text-primary">{t("account.sidebar.bookingsActivity")}</p>
        <div className="flex w-full flex-col items-start gap-4">
          {bookingsSection.map((item) => (
            <AccountNavLink
              key={item.href}
              icon={item.icon}
              label={t(item.labelKey)}
              href={item.href}
              activeWhen={"activeWhen" in item ? item.activeWhen : undefined}
              badge={"badgeFor" in item && item.badgeFor ? badgeByKey[item.badgeFor] : undefined}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-3">
        <p className="w-full text-base text-text-primary">{t("account.sidebar.accountsSupport")}</p>
        <div className="flex w-full flex-col items-start gap-4">
          {accountsSection.map((item) => (
            <AccountNavLink
              key={item.href}
              icon={item.icon}
              label={t(item.labelKey)}
              href={item.href}
              badge={"badgeFor" in item && item.badgeFor ? badgeByKey[item.badgeFor] : undefined}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-3">
        <p className="w-full text-base text-text-primary">{t("account.sidebar.settings")}</p>
        <div className="flex w-full flex-col items-start gap-4">
          {/* Google accounts have no password to change, nor does anyone when password login is off. */}
          {user?.login_type !== "google" && loginSettings.customer_password_login_enabled && (
            <AccountNavLink
              icon={KeyRound}
              label={t("account.sidebar.changePassword")}
              href="/change-password"
            />
          )}
          <AccountNavAction
            icon={LogoutMenuIcon}
            label={t("header.logout")}
            onClick={() => setLogoutConfirmOpen(true)}
          />
          <AccountNavLink icon={Trash2} label={t("account.sidebar.deleteAccount")} href="/delete-account" />
        </div>
      </div>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="gap-6 rounded-2xl border border-border-default p-4 ring-0">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center rounded-xl bg-bg-brand-subtle p-3">
              <LogoutMenuIcon className="size-7 text-button-primary-bg" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <AlertDialogTitle className="text-lg font-medium text-text-primary">
                {t("header.logoutConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-text-secondary">
                {t("header.logoutConfirmDescription")}
              </AlertDialogDescription>
            </div>
          </div>
          <div className="flex w-full gap-4">
            <AppButton variant="primary" size="md" className="flex-1" onClick={handleLogout}>
              {t("header.logout")}
            </AppButton>
            <AppButton
              variant="secondary-outline"
              size="md"
              className="flex-1"
              onClick={() => setLogoutConfirmOpen(false)}
            >
              {t("common.cancel")}
            </AppButton>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
