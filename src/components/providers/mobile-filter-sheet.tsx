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
import { StarIcon } from "@/components/icons/icons";
import { PRICE_MAX, PRICE_MIN, SERVICE_MODE_OPTIONS } from "@/lib/providers-query";
import type { ServiceMode } from "@/lib/providers-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

export type ProviderMobileSortValue = "rating" | "price-desc" | "price-asc";

export interface ProviderMobileFiltersValue {
  sort: ProviderMobileSortValue | null;
  rating: number | null;
  // null = no price filter applied (full range) — see the note in lib/providers-query.ts.
  priceMax: number | null;
  serviceModes: ServiceMode[];
}

export const DEFAULT_PROVIDER_MOBILE_FILTERS: ProviderMobileFiltersValue = {
  sort: null,
  rating: null,
  priceMax: null,
  serviceModes: [],
};

const RATING_OPTIONS = [5, 4, 3];

/** max-lg filter bottom sheet for the /providers category view — same shape and
 * styling as services/mobile-filter-sheet.tsx, with service-mode chips
 * standing in for services' duration buckets. */
export function ProviderMobileFilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
  priceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProviderMobileFiltersValue;
  onApply: (value: ProviderMobileFiltersValue) => void;
  priceBounds?: { min: number; max: number };
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ProviderMobileFiltersValue>(value);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const sortOptions: {
    value: ProviderMobileSortValue;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
  }[] = [
    { value: "rating", label: t("providers.sort.highlyRated"), icon: StarIcon },
    { value: "price-desc", label: t("providers.sort.priceHighToLow"), icon: ArrowDownNarrowWide },
    { value: "price-asc", label: t("providers.sort.priceLowToHigh"), icon: ArrowUpNarrowWide },
  ];

  const priceBoundsSpan = priceBounds.max - priceBounds.min;
  const pricePercent =
    priceBoundsSpan > 0
      ? (((draft.priceMax ?? priceBounds.max) - priceBounds.min) / priceBoundsSpan) * 100
      : 0;

  const toggleServiceMode = (mode: ServiceMode) => {
    setDraft((current) => ({
      ...current,
      serviceModes: current.serviceModes.includes(mode)
        ? current.serviceModes.filter((item) => item !== mode)
        : [...current.serviceModes, mode],
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

          <FilterGroup title={t("providerDetails.filters.serviceModeTitle")}>
            {SERVICE_MODE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={draft.serviceModes.includes(option.value)}
                onClick={() => toggleServiceMode(option.value)}
              >
                {t(`providerDetails.filters.serviceModeOptions.${option.key}`)}
              </FilterChip>
            ))}
          </FilterGroup>
        </div>

        <div className="flex items-center gap-3 border-t border-border-default p-4">
          <AppButton
            variant="primary-outline"
            size="md"
            className="flex-1 bg-bg-brand-subtle"
            onClick={() => setDraft(DEFAULT_PROVIDER_MOBILE_FILTERS)}
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
