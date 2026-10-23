"use client";

import { Link } from "@/components/ui/locale-link";
import { usePathnameCompat } from "@/lib/next-router-compat";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/general-bookings", labelKey: "nav.generalBookings" },
  { href: "/requested-bookings", labelKey: "nav.requestedBookings" },
] as const;

export function BookingsTabsNav() {
  const pathname = usePathnameCompat();
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center gap-3">
      {TABS.map(({ href, labelKey }) => {
        const active = pathname.endsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full px-4 py-3 text-base",
              active
                ? "bg-bg-inverse text-text-inverse-dark"
                : "border border-border-default bg-bg-primary text-text-primary"
            )}
          >
            {t(labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
