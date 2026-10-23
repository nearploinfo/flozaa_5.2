"use client";

import { Link } from "@/components/ui/locale-link";
import { usePathnameCompat } from "@/lib/next-router-compat";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/general-bookings", labelKey: "nav.generalBookings" },
  { href: "/requested-bookings", labelKey: "nav.requestedBookings" },
] as const;

/** Mobile-only underlined tab bar — desktop keeps bookings-tabs-nav.tsx's
 * pill-style tabs unchanged. */
export function MobileBookingsTabsNav() {
  const pathname = usePathnameCompat();
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-stretch border-b-[1.5px] border-border-muted bg-bg-primary xl:hidden">
      {TABS.map(({ href, labelKey }) => {
        const active = pathname.endsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 pt-2",
              active ? "text-text-brand" : "text-text-primary"
            )}
          >
            <span className={cn("px-3 text-xs whitespace-nowrap sm:text-sm", active ? "font-semibold" : "font-normal")}>
              {t(labelKey)}
            </span>
            <span className={cn("h-1 w-full rounded-t-lg", active ? "bg-bg-brand" : "bg-transparent")} />
          </Link>
        );
      })}
    </div>
  );
}
