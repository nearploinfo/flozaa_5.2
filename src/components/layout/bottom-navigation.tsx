"use client";

import { Link } from "@/components/ui/locale-link";
import { useParamsCompat, usePathnameCompat } from "@/lib/next-router-compat";
import {
  BottomNavHomeIcon,
  BottomNavHomeOutlineIcon,
  BottomNavBookingsIcon,
  BottomNavChatIcon,
  BottomNavRequestIcon,
  BottomNavProfileIcon,
} from "@/components/layout/bottom-nav-icons";
import { bottomNavItems, isBottomNavPath } from "@/lib/navigation-config";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useRequireAuth } from "@/lib/use-require-auth";

/** Tabs that need a signed-in user — tapping them while logged out shows the
 * login gate (bottom sheet on mobile, see useRequireAuth) instead of
 * navigating to a page that has nothing to show a guest. */
const AUTH_GATED_HREFS = new Set(["/general-bookings", "/chats", "/my-services-requests"]);

const ICONS: Record<string, typeof BottomNavHomeIcon> = {
  "/": BottomNavHomeIcon,
  "/general-bookings": BottomNavBookingsIcon,
  "/chats": BottomNavChatIcon,
  "/my-services-requests": BottomNavRequestIcon,
  "/account": BottomNavProfileIcon,
};

export function BottomNavigation() {
  const pathname = usePathnameCompat();
  const params = useParamsCompat<{ lang?: string }>();
  const lang = params?.lang;
  const localePath =
    lang && pathname.startsWith(`/${lang}`)
      ? pathname.slice(lang.length + 1) || "/"
      : pathname;
  const { t } = useTranslation();
  const { isLoggedIn, requireAuth } = useRequireAuth();

  const showBottomNav = isBottomNavPath(localePath);

  return (
    showBottomNav &&
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-bg-primary xl:hidden">
      <div className="flex items-center justify-between px-2 py-2">
        {bottomNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? localePath === "/"
              : item.href === "/general-bookings"
                ? localePath === item.href || localePath === "/requested-bookings"
                : localePath === item.href || localePath.startsWith(`${item.href}/`);
          // Home is the only filled icon (matches the active-tab design) — every
          // other icon is outline-only at both states, so Home needs its own
          // outline variant for inactive to read consistently with the rest.
          const Icon = item.href === "/" && !isActive ? BottomNavHomeOutlineIcon : ICONS[item.href];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                if (AUTH_GATED_HREFS.has(item.href) && !isLoggedIn) {
                  event.preventDefault();
                  requireAuth(() => {});
                }
              }}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1 text-xs transition-colors",
                isActive ? "text-text-brand font-semibold" : "text-icon-secondary"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-2xl px-2 py-1",
                  isActive && "bg-bg-brand-subtle"
                )}
              >
                {Icon && <Icon className="size-6" />}
              </span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
