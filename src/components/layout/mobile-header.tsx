"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { Bell, ChevronDown, Search, User } from "lucide-react";
import { LocationModal } from "@/components/layout/location-modal";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { localizePath } from "@/lib/i18n/locale-path";
import { useTranslation } from "@/lib/i18n/translation-context";

/**
 * Figma splits the location text into a bold title + a lighter address
 * subtitle ("Time Square Empire, 262" / "Bhuj, Kutch Gujarat"), but
 * location-slice only stores one address string — no name/area split in the
 * data model yet. Rendering the full string as the bold line until that
 * lands; the subtitle line is omitted rather than fabricated.
 */
export function MobileHeader() {


  const pathname = useRouter().pathname;
  
  // "/[lang]" is the dynamic route (e.g. /en); "/" is the generated bare
  // wrapper for the default locale (see generate-locale-wrappers.mjs) — both
  // render the home page, so both count.
  const isHomePage = pathname === "/[lang]" || pathname === "/";

  const [locationOpen, setLocationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const hasHydrated = useHasHydrated();
  const current = useAppSelector((state) => state.location.current);
  const user = useAppSelector((state) => state.auth.user);
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();

  const label = hasHydrated ? (current ?? t("common.addLocation")) : t("common.addLocation");
  const avatarUrl = hasHydrated && typeof user?.image === "string" ? user.image : undefined;
  const showNotifications = hasHydrated && !!user;

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`${localizePath("/services", lang, defaultLocale)}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    isHomePage &&
    <div className="sticky top-0 z-30 self-stretch rounded-bl-2xl rounded-br-2xl bg-bg-brand p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)] xl:hidden">
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <AppImage
            src={avatarUrl}
            alt=""
            className="size-10 shrink-0 rounded-full border-2 border-border-white object-cover"
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-primary p-2">
            <User className="size-5 text-icon-primary" />
          </span>
        )}

        <button
          type="button"
          onClick={() => setLocationOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-1 text-start"
        >
          <span className="line-clamp-1 text-sm font-bold text-text-inverse-light">{label}</span>
          <ChevronDown className="size-5 shrink-0 text-text-inverse-light" />
        </button>

        {showNotifications && (
          <Link
            href="/notifications"
            aria-label={t("nav.notifications")}
            className="flex size-10 shrink-0 items-center justify-center rounded-3xl bg-bg-primary p-2"
          >
            <Bell className="size-6 text-icon-primary" />
          </Link>
        )}
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="mt-4 flex h-12 w-full items-center gap-2 rounded-xl bg-form-field-bg px-4 py-3"
      >
        <Search className="size-6 shrink-0 text-icon-primary" />
        <input
          type="text"
          name="query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("header.searchPlaceholder")}
          className="flex-1 bg-transparent text-sm text-form-field-text placeholder:text-form-field-placeholder focus:outline-none"
        />
      </form>

      <LocationModal open={locationOpen} onOpenChange={setLocationOpen} />
    </div>
  );
}
