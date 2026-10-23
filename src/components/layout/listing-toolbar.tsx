"use client";

import type { ReactNode } from "react";
import { List, Map, Search, SlidersHorizontal, X } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

export type ListingSortOption = DropdownOption;
export type ListingViewMode = "list" | "map";

function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ListingViewMode;
  onViewModeChange: (mode: ListingViewMode) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border-default bg-bg-secondary p-2">
      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-base ${
          viewMode === "list" ? "bg-bg-inverse text-text-inverse-dark" : "text-text-secondary"
        }`}
      >
        <List className="size-4" />
        {t("common.list")}
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("map")}
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-base ${
          viewMode === "map" ? "bg-bg-inverse text-text-inverse-dark" : "text-text-secondary"
        }`}
      >
        <Map className="size-4" />
        {t("common.map")}
      </button>
    </div>
  );
}

export function ListingToolbar({
  resultsLabel,
  sortOptions,
  sortValue,
  onSortChange,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  viewMode,
  onViewModeChange,
  appliedFilters,
  variant = "card",
  onOpenFilters,
}: {
  resultsLabel: string;
  sortOptions: ListingSortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value?: string) => void;
  searchPlaceholder?: string;
  viewMode?: ListingViewMode;
  onViewModeChange?: (mode: ListingViewMode) => void;
  appliedFilters?: ReactNode;
  /** "card" (default): floating rounded card, used in the normal list layout.
   * "flat": edge-to-edge bar with only a bottom border, used inside MapViewOverlay. */
  variant?: "card" | "flat";
  /** Shows a filter-sheet trigger button below `lg`, where FilterSidebar hides itself. */
  onOpenFilters?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={
        variant === "flat"
          ? "flex flex-col gap-4 border-b border-border-default bg-bg-primary px-10 py-6"
          : "flex flex-col gap-6 rounded-xl border border-border-default bg-bg-primary p-6"
      }
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex-1 text-lg text-text-primary">{resultsLabel}</div>

        <div className="flex flex-1 flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg text-text-primary">{t("common.sortBy")}</span>
            <Dropdown className="w-52" options={sortOptions} value={sortValue} onChange={onSortChange} />
          </div>

          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit?.();
            }}
            className="relative flex-1"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder ?? t("common.search")}
              className="w-full rounded-lg border border-border-default bg-bg-secondary p-3 pr-24 text-base text-text-primary placeholder:text-text-secondary outline-none"
            />
            {searchValue.length > 0 && (
              <button
                type="button"
                aria-label={t("search.clearSearch")}
                onClick={() => {
                  onSearchChange("");
                  onSearchSubmit?.("");
                }}
                className="absolute top-1/2 right-24 -translate-y-1/2 rounded-full p-1 text-icon-secondary hover:text-icon-primary"
              >
                <X className="size-4" />
              </button>
            )}
            <AppButton
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={Search}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md px-2 py-1"
            >
              {t("common.search")}
            </AppButton>
          </form>
        </div>

        {viewMode && onViewModeChange && (
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        )}

        {onOpenFilters && (
          <button
            type="button"
            aria-label={t("search.openFilters")}
            onClick={onOpenFilters}
            className="shrink-0 rounded-lg border border-border-default p-2.5 xl:hidden"
          >
            <SlidersHorizontal className="size-5 text-icon-primary" />
          </button>
        )}
      </div>

      {appliedFilters}
    </div>
  );
}
