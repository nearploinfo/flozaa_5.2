"use client";

import { useState } from "react";
import { User } from "lucide-react";
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
  ChevronDownIcon,
  ChevronRightIcon,
  AccountBookingsIcon,
  ChatsWithProvidersIcon,
  AccountNotificationsIcon,
  AccountBookmarksIcon,
  MyServiceRequestsIcon,
  AccountAddressesIcon,
  PaymentHistoryIcon,
  LogoutMenuIcon,
} from "@/components/icons/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/auth-slice";
import { signOutFirebase } from "@/lib/firebase";
import { logoutApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";

const menuItems = [
  { labelKey: "nav.bookings", href: "/general-bookings", icon: AccountBookingsIcon },
  { labelKey: "nav.chatsWithProviders", href: "/chats", icon: ChatsWithProvidersIcon, badgeFor: "providerChats" as const },
  { labelKey: "nav.notifications", href: "/notifications", icon: AccountNotificationsIcon },
  { labelKey: "nav.bookmarks", href: "/bookmarks", icon: AccountBookmarksIcon },
  { labelKey: "nav.myServiceRequests", href: "/my-services-requests", icon: MyServiceRequestsIcon },
  { labelKey: "nav.addresses", href: "/addresses", icon: AccountAddressesIcon },
  { labelKey: "nav.paymentHistory", href: "/payment-history", icon: PaymentHistoryIcon },
];

export function ProfileMenu() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const unreadCounts = useAppSelector((state) => state.chatUI.unreadCounts);
  const badgeByKey: Record<"providerChats", number> = {
    providerChats: unreadCounts.pre_booking + unreadCounts.booking,
  };

  if (!user) return null;

  const displayName = user.username || user.email || user.phone || t("header.login");
  const secondaryLine = user.phone
    ? `${user.country_code ? `${user.country_code} ` : ""}${user.phone}`
    : user.email;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const handleLogout = async () => {
    logoutApi().catch(() => {});
    signOutFirebase();
    dispatch(clearAuth());
    toast.success(t("header.logoutSuccess"));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-44 items-center justify-center gap-2 rounded-lg bg-bg-brand-subtle p-2"
          >
            <span className="flex size-7 shrink-0 items-center justify-center">
              <User className="size-6 text-text-brand" />
            </span>
            <span className="min-w-0 flex-1 text-start">
              <span className="line-clamp-1 w-full text-base text-text-brand">{displayName}</span>
            </span>
            <ChevronDownIcon className="size-6 shrink-0 text-text-brand" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 gap-0 rounded-lg p-0">
          <div className="m-1 flex items-center gap-3 rounded-lg border border-border-default bg-bg-secondary p-3">
            <Avatar className="size-8">
              {user.image && <AvatarImage src={user.image} alt={displayName} />}
              <AvatarFallback className="bg-bg-brand text-sm font-medium text-icon-inverse">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span className="line-clamp-1 w-full text-sm font-medium text-text-primary">
                {displayName}
              </span>
              {secondaryLine && (
                <span className="w-full text-sm break-all text-text-secondary">{secondaryLine}</span>
              )}
            </div>
            <Link
              href="/profile"
              className="flex size-6 shrink-0 items-center justify-center rounded-sm text-button-link-secondary-text hover:bg-accent"
            >
              <ChevronRightIcon className="size-5 rtl:rotate-180" />
            </Link>
          </div>

          {menuItems.map((item) => {
            const badge = "badgeFor" in item && item.badgeFor ? badgeByKey[item.badgeFor] : undefined;
            return (
              <DropdownMenuItem key={item.href} asChild className="gap-2 rounded-none p-3 cursor-pointer">
                <Link href={item.href} className="flex w-full items-center gap-2">
                  <item.icon className="size-5 shrink-0 text-icon-primary" />
                  <span className="flex-1 text-sm text-text-primary">{t(item.labelKey)}</span>
                  {!!badge && (
                    <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-bg-error px-1.5 py-0.5 text-xs font-medium text-text-inverse-dark!">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setLogoutConfirmOpen(true)}
            className="gap-2 rounded-none p-3 cursor-pointer"
          >
            <LogoutMenuIcon className="size-5 shrink-0" />
            <span className="flex-1 text-sm">{t("header.logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
