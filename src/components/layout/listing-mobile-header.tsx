"use client";

import { List, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import { AppButton } from "@/components/ui/app-button";
import { Link } from "@/components/ui/locale-link";
import type { ListingViewMode } from "@/components/layout/listing-toolbar";
import { useTranslation } from "@/lib/i18n/translation-context";

// Below-`lg` header shared by /services and /providers (and matched by
// /search's own copy of this same markup) — back button + title + map/list
// toggle, a search + filter-sheet row, and a Services/Provider tab switch.
export function ListingMobileHeader({
  title,
  viewMode,
  onViewModeChange,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  onOpenFilters,
  activeTab,
  tabHref,
  showTabs = true,
}: {
  title: string;
  viewMode: ListingViewMode;
  onViewModeChange: (mode: ListingViewMode) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value?: string) => void;
  searchPlaceholder?: string;
  onOpenFilters: () => void;
  activeTab: "services" | "providers";
  /** Href for the *other* tab (current tab is plain text, not a link). */
  tabHref: string;
  /** Hide the Services/Provider tab switch — used for the bare landing view (no query params at all). */
  showTabs?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col xl:hidden">
      <MobileBreadcrum
        title={title}
        headerAction={
          <AppButton
            variant="secondary"
            size="sm"
            leftIcon={viewMode === "map" ? List : MapIcon}
            className="rounded-lg"
            onClick={() => onViewModeChange(viewMode === "map" ? "list" : "map")}
          >
            {viewMode === "map" ? t("common.list") : t("common.map")}
          </AppButton>
        }
      />

      <div className="container flex flex-col gap-4 bg-bg-primary pt-1 pb-3">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit?.();
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-icon-secondary" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-border-brand bg-bg-secondary py-2.5 pr-10 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
            {searchValue.length > 0 && (
              <button
                type="button"
                aria-label={t("search.clearSearch")}
                onClick={() => {
                  onSearchChange("");
                  onSearchSubmit?.("");
                }}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X className="size-4 text-icon-primary" />
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label={t("search.openFilters")}
            onClick={onOpenFilters}
            className="shrink-0 rounded-lg border border-border-default p-2.5"
          >
            <SlidersHorizontal className="size-5 text-icon-primary" />
          </button>
        </form>

        {showTabs && (
          <div className="flex items-center border-b border-border-default">
            <span
              className={`flex-1 border-b-2 pb-2 text-center text-sm font-medium ${
                activeTab === "services"
                  ? "border-bg-brand text-text-brand"
                  : "border-transparent text-text-secondary"
              }`}
            >
              {activeTab === "services" ? (
                t("search.servicesTab")
              ) : (
                <Link href={tabHref}>{t("search.servicesTab")}</Link>
              )}
            </span>
            <span
              className={`flex-1 border-b-2 pb-2 text-center text-sm font-medium ${
                activeTab === "providers"
                  ? "border-bg-brand text-text-brand"
                  : "border-transparent text-text-secondary"
              }`}
            >
              {activeTab === "providers" ? (
                t("search.providerTab")
              ) : (
                <Link href={tabHref}>{t("search.providerTab")}</Link>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
