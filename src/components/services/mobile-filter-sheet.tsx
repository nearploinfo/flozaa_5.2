"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { Slider } from "@/components/ui/slider";
import { FilterChip, FilterGroup } from "@/components/ui/filter-chip";
import { LocationPinIcon, StarIcon } from "@/components/icons/icons";
import { DURATION_OPTION_KEYS } from "@/components/services/service-filters";
import { PRICE_MAX, PRICE_MIN } from "@/lib/services-query";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Sort values are the listing's own UI values plus "nearest", which has no API equivalent yet. */
export type MobileSortValue = "rating" | "nearest" | "price-desc" | "price-asc";

export interface MobileFiltersValue {
  sort: MobileSortValue | null;
  /** Minimum rating, e.g. 4 means "+4 Star". null = All. */
  rating: number | null;
  // null = no price filter applied (full range) — see the note in lib/services-query.ts.
  priceMax: number | null;
  durations: string[];
}

export const DEFAULT_MOBILE_FILTERS: MobileFiltersValue = {
  sort: null,
  rating: null,
  priceMax: null,
  durations: [],
};

const RATING_OPTIONS = [5, 4, 3];

/** max-lg filter bottom sheet — the compact counterpart to the ServiceFilters sidebar. */
export function MobileFilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
  priceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: MobileFiltersValue;
  onApply: (value: MobileFiltersValue) => void;
  priceBounds?: { min: number; max: number };
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<MobileFiltersValue>(value);
  const [wasOpen, setWasOpen] = useState(open);

  // The sheet edits a draft copy so nothing changes until "Apply" — re-seed it
  // from the applied filters on each open (adjusted during render rather than
  // in an effect, so the first paint already shows the current selection).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const sortOptions: {
    value: MobileSortValue;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
  }[] = [
    { value: "rating", label: t("services.sort.topRated"), icon: StarIcon },
    { value: "nearest", label: t("services.sort.nearestFirst"), icon: LocationPinIcon },
    { value: "price-desc", label: t("services.sort.priceHighToLow"), icon: ArrowDownNarrowWide },
    { value: "price-asc", label: t("services.sort.priceLowToHigh"), icon: ArrowUpNarrowWide },
  ];

  const priceBoundsSpan = priceBounds.max - priceBounds.min;
  const pricePercent =
    priceBoundsSpan > 0
      ? (((draft.priceMax ?? priceBounds.max) - priceBounds.min) / priceBoundsSpan) * 100
      : 0;

  const toggleDuration = (key: string) => {
    setDraft((current) => ({
      ...current,
      durations: current.durations.includes(key)
        ? current.durations.filter((item) => item !== key)
        : [...current.durations, key],
    }));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-primary xl:hidden">
        <DrawerHeader className="border-b border-border-default px-4 pb-3">
          <DrawerTitle className="text-base font-semibold text-text-primary">
            {t("services.filters.filterBy")}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
          <FilterGroup title={t("services.filters.sortByTitle")}>
            {sortOptions.map((option) => (
              <FilterChip
                key={option.value}
                active={draft.sort === option.value}
                icon={option.icon}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    sort: current.sort === option.value ? null : option.value,
                  }))
                }
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup title={t("services.filters.ratingTitle")}>
            <FilterChip
              active={draft.rating === null}
              icon={StarIcon}
              onClick={() => setDraft((current) => ({ ...current, rating: null }))}
            >
              {t("services.filters.ratingAll")}
            </FilterChip>
            {RATING_OPTIONS.map((stars) => (
              <FilterChip
                key={stars}
                active={draft.rating === stars}
                icon={StarIcon}
                onClick={() => setDraft((current) => ({ ...current, rating: stars }))}
              >
                {stars === 5
                  ? t("services.filters.starCount", { count: stars })
                  : t("services.filters.starPlus", { count: stars })}
              </FilterChip>
            ))}
          </FilterGroup>

          <div className="flex flex-col items-start gap-3">
            <span className="text-sm font-semibold text-text-primary">
              {t("services.filters.priceRangeTitle")}
            </span>
            <div className="relative w-full pt-8">
              <span
                style={{ left: `${pricePercent}%` }}
                className="absolute top-0 -translate-x-1/2 rounded-full bg-bg-brand px-2 py-0.5 text-xs font-medium text-button-primary-text"
              >
                {(draft.priceMax ?? priceBounds.max).toLocaleString()}
              </span>
              <Slider
                min={priceBounds.min}
                max={priceBounds.max}
                step={10}
                value={[draft.priceMax ?? priceBounds.max]}
                onValueChange={(next) =>
                  setDraft((current) => ({ ...current, priceMax: next[0] }))
                }
                className="[&_[data-slot=slider-thumb]]:size-5"
              />
              <div className="mt-2 flex items-center justify-between text-sm text-text-primary">
                <span>{priceBounds.min}</span>
                <span>{priceBounds.max.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <FilterGroup title={t("services.filters.durationTitle")}>
            {DURATION_OPTION_KEYS.map((key) => (
              <FilterChip
                key={key}
                active={draft.durations.includes(key)}
                onClick={() => toggleDuration(key)}
              >
                {t(`services.filters.durationOptions.${key}`)}
              </FilterChip>
            ))}
          </FilterGroup>
        </div>

        <div className="flex items-center gap-3 border-t border-border-default p-4">
          <AppButton
            variant="primary-outline"
            size="md"
            className="flex-1 bg-bg-brand-subtle"
            onClick={() => setDraft(DEFAULT_MOBILE_FILTERS)}
          >
            {t("services.filters.clearFilter")}
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {t("services.filters.apply")}
          </AppButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
