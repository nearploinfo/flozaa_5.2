"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FilterCheckbox, FilterSection } from "@/components/layout/filter-sidebar";
import { AppButton } from "@/components/ui/app-button";
import { Slider } from "@/components/ui/slider";
import { StarIcon, CloseIcon } from "@/components/icons/icons";
import { DURATION_OPTION_KEYS } from "@/components/services/service-filters";
import { PRICE_MAX, PRICE_MIN } from "@/lib/services-query";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCurrencySymbol } from "@/lib/show-price";
import type { MobileSortValue } from "@/components/services/mobile-filter-sheet";

const RATING_OPTIONS = [5, 4, 3, 2, 1];

export interface ProviderFiltersValue {
  sort: MobileSortValue | null;
  categories: string[];
  durations: string[];
  rating: number | null;
  // null = no price filter applied — see the note in lib/services-query.ts.
  priceMax: number | null;
}

export function defaultProviderFilters(): ProviderFiltersValue {
  return { sort: null, categories: [], durations: [], rating: null, priceMax: null };
}

/** Desktop "More Filters" dialog for the provider services tab — mirrors the
 * FilterSidebar accordion sections but as a centered modal instead of a rail,
 * since this page has no permanent sidebar to dock into. */
export function ProviderFiltersModal({
  open,
  onOpenChange,
  value,
  categoryOptions,
  priceBounds = { min: PRICE_MIN, max: PRICE_MAX },
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProviderFiltersValue;
  /** { name, count } for every category present among this provider's services. */
  categoryOptions: { name: string; count: number }[];
  /** Real price range from the API (get_all_services' service_min_price/
   * service_max_price) — sizes the slider so services priced above the
   * static PRICE_MAX fallback are still reachable. */
  priceBounds?: { min: number; max: number };
  onApply: (value: ProviderFiltersValue) => void;
}) {
  const { t } = useTranslation();
  const currencySymbol = useCurrencySymbol();
  const [draft, setDraft] = useState<ProviderFiltersValue>(value);
  const [wasOpen, setWasOpen] = useState(open);
  const [openSection, setOpenSection] = useState<
    "categories" | "duration" | "ratings" | "price" | null
  >(null);

  // Edits a draft copy so nothing applies until "Apply Filter" — re-seed it
  // from the applied value each time the modal opens.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(value);
      setOpenSection(null);
    }
  }

  const toggleCategory = (name: string) => {
    setDraft((current) => ({
      ...current,
      categories: current.categories.includes(name)
        ? current.categories.filter((item) => item !== name)
        : [...current.categories, name],
    }));
  };

  const toggleDuration = (key: string) => {
    setDraft((current) => ({
      ...current,
      durations: current.durations.includes(key)
        ? current.durations.filter((item) => item !== key)
        : [...current.durations, key],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!flex max-h-[85vh] w-[600px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-border-default bg-bg-primary p-0 sm:max-w-[600px]"
      >
        <div className="flex shrink-0 items-center gap-6 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-xl font-medium text-text-primary">
            {t("providerDetails.services.moreFilters")}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
            className="rounded-lg border border-border-default bg-bg-secondary p-2"
          >
            <CloseIcon className="size-6 text-button-secondary-outline-text" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          <FilterSection
            title={t("services.filters.categories")}
            open={openSection === "categories"}
            onOpenChange={(next) => setOpenSection(next ? "categories" : null)}
          >
            <div className="flex max-h-56 flex-col gap-6 overflow-y-auto pr-1">
              {categoryOptions.map(({ name, count }) => (
                <FilterCheckbox
                  key={name}
                  label={`${name} (${count})`}
                  checked={draft.categories.includes(name)}
                  onChange={() => toggleCategory(name)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title={t("services.filters.duration")}
            open={openSection === "duration"}
            onOpenChange={(next) => setOpenSection(next ? "duration" : null)}
          >
            {DURATION_OPTION_KEYS.map((key) => (
              <FilterCheckbox
                key={key}
                label={t(`services.filters.durationOptions.${key}`)}
                checked={draft.durations.includes(key)}
                onChange={() => toggleDuration(key)}
              />
            ))}
          </FilterSection>

          <FilterSection
            title={t("services.filters.ratings")}
            open={openSection === "ratings"}
            onOpenChange={(next) => setOpenSection(next ? "ratings" : null)}
          >
            {RATING_OPTIONS.map((stars) => (
              <label
                key={stars}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-bg-secondary"
              >
                <span className="relative flex size-4 shrink-0 items-center justify-center">
                  <input
                    type="radio"
                    name="provider-filters-rating"
                    checked={draft.rating === stars}
                    onChange={() => setDraft((current) => ({ ...current, rating: stars }))}
                    className={`absolute inset-0 size-4 cursor-pointer appearance-none rounded-full border transition-transform duration-150 active:scale-90 ${
                      draft.rating === stars ? "border-bg-brand" : "border-border-strong"
                    }`}
                  />
                  {draft.rating === stars && (
                    <span className="pointer-events-none size-2 rounded-full bg-bg-brand" />
                  )}
                </span>
                <span className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon
                      key={index}
                      className={`size-4 transition-colors duration-150 ${
                        index < stars ? "text-icon-warning" : "text-icon-tertiary"
                      }`}
                    />
                  ))}
                </span>
              </label>
            ))}
          </FilterSection>

          <FilterSection
            title={t("services.filters.price", { symbol: currencySymbol })}
            open={openSection === "price"}
            onOpenChange={(next) => setOpenSection(next ? "price" : null)}
          >
            <div className="flex items-center justify-between text-sm text-text-primary">
              <span>{priceBounds.min}</span>
              <span>{priceBounds.max.toLocaleString()}</span>
            </div>
            <Slider
              min={priceBounds.min}
              max={priceBounds.max}
              step={10}
              value={[draft.priceMax ?? priceBounds.max]}
              onValueChange={(next) => setDraft((current) => ({ ...current, priceMax: next[0] }))}
              className="py-1"
            />
            <div className="flex items-center justify-between text-sm font-medium text-text-brand">
              <span>{priceBounds.min}</span>
              <span>{(draft.priceMax ?? priceBounds.max).toLocaleString()}</span>
            </div>
          </FilterSection>
        </div>

        <div className="flex shrink-0 items-center gap-6 border-t border-border-default px-6 py-4">
          <AppButton
            variant="primary"
            size="md"
            className="flex-1 justify-center"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {t("services.filters.apply")}
          </AppButton>
          <AppButton
            variant="primary-outline"
            size="md"
            className="flex-1 justify-center"
            onClick={() => setDraft(defaultProviderFilters())}
          >
            {t("services.filters.clearFilter")}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
