"use client";

import { useEffect, useRef, useState } from "react";
import { StarIcon } from "@/components/icons/icons";
import {
  FilterCheckbox,
  FilterSection,
  FilterSidebar,
} from "@/components/layout/filter-sidebar";
import { CategoryFilterTree } from "@/components/providers/category-filter-tree";
import { Slider } from "@/components/ui/slider";
import { getCategoriesHierarchicalApi } from "@/api/apiRoutes";
import {
  toCategoryTreeNode,
  type CategoryHierarchicalApi,
  type CategoryTreeNode,
} from "@/lib/categories-tree-api";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCurrencySymbol } from "@/lib/show-price";

export const DURATION_OPTION_KEYS = [
  "under30Min",
  "30to60Min",
  "1to2Hours",
  "2to4Hours",
  "4PlusHours",
];

const RATING_OPTIONS = [5, 4, 3, 2, 1];

const PRICE_MIN = 0;
const PRICE_MAX = 2000;

export interface ServiceFiltersValue {
  categorySlugs: string[];
  durations: string[];
  rating: number | null;
  // null = no price filter applied — see the note in lib/services-query.ts.
  priceMin: number | null;
  priceMax: number | null;
}

export function ServiceFilters({
  initialFilters,
  onFiltersChange,
  onCategoryTreeChange,
  variant,
  priceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  initialFilters?: ServiceFiltersValue;
  onFiltersChange?: (filters: ServiceFiltersValue) => void;
  onCategoryTreeChange?: (tree: CategoryTreeNode[]) => void;
  variant?: "sidebar" | "bare";
  /** Real price range from the API (get_all_services' service_min_price/
   * service_max_price) — sizes the slider so services priced above the
   * static PRICE_MAX fallback are still reachable. */
  priceBounds?: { min: number; max: number };
}) {
  const { t } = useTranslation();
  const currencySymbol = useCurrencySymbol();
  const [categories, setCategories] = useState<Set<string>>(
    () => new Set(initialFilters?.categorySlugs)
  );
  const [durations, setDurations] = useState<string[]>(() => initialFilters?.durations ?? []);
  const [rating, setRating] = useState<number | null>(() => initialFilters?.rating ?? null);
  const initialPriceRange: [number, number] = [
    initialFilters?.priceMin ?? priceBounds.min,
    initialFilters?.priceMax ?? priceBounds.max,
  ];
  // `priceRange` drives the thumbs/labels while dragging (updates every
  // frame); `committedPriceRange` only updates on release (onValueCommit)
  // and is what actually triggers a refetch — otherwise every pixel of drag
  // would fire an API call. `priceTouched` tracks whether the user has ever
  // committed a drag — untouched means "send no price filter at all" (null).
  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange);
  const [committedPriceRange, setCommittedPriceRange] =
    useState<[number, number]>(initialPriceRange);
  const [priceTouched, setPriceTouched] = useState(
    initialFilters?.priceMin != null || initialFilters?.priceMax != null
  );
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);

  useEffect(() => {
    getCategoriesHierarchicalApi().then((response) => {
      const nodes: CategoryHierarchicalApi[] = response?.data ?? [];
      const tree = nodes.map(toCategoryTreeNode);
      setCategoryTree(tree);
      onCategoryTreeChange?.(tree);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify the parent (e.g. ServicesView) whenever filter selections change so
  // it can refetch from the API — this component stays the source of truth
  // for the UI state, the parent just observes it. Skip the mount firing:
  // nothing actually changed yet, and echoing defaults up would trigger a
  // needless duplicate fetch in the parent.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onFiltersChange?.({
      categorySlugs: [...categories],
      durations,
      rating,
      priceMin: priceTouched ? committedPriceRange[0] : null,
      priceMax: priceTouched ? committedPriceRange[1] : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, durations, rating, committedPriceRange, priceTouched]);

  const toggle = (list: string[], value: string, setList: (value: string[]) => void) => {
    setList(
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
    );
  };

  const toggleCategory = (id: string) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearAll = () => {
    setCategories(new Set());
    setDurations([]);
    setRating(null);
    setPriceRange([priceBounds.min, priceBounds.max]);
    setCommittedPriceRange([priceBounds.min, priceBounds.max]);
    setPriceTouched(false);
  };

  const hasActiveFilters =
    categories.size > 0 || durations.length > 0 || rating !== null || priceTouched;

  return (
    <FilterSidebar onClear={clearAll} hasActiveFilters={hasActiveFilters} variant={variant}>
      <FilterSection title={t("services.filters.categories")} defaultOpen={categories.size > 0}>
        <CategoryFilterTree
          categories={categoryTree}
          selected={categories}
          onToggleSelect={toggleCategory}
        />
      </FilterSection>

      <FilterSection title={t("services.filters.duration")} defaultOpen={durations.length > 0}>
        {DURATION_OPTION_KEYS.map((key) => (
          <FilterCheckbox
            key={key}
            label={t(`services.filters.durationOptions.${key}`)}
            checked={durations.includes(key)}
            onChange={() => toggle(durations, key, setDurations)}
          />
        ))}
      </FilterSection>

      <FilterSection title={t("services.filters.ratings")} defaultOpen={rating !== null}>
        {RATING_OPTIONS.map((stars) => (
          <label
            key={stars}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-bg-secondary"
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <input
                type="radio"
                name="rating"
                checked={rating === stars}
                onChange={() => setRating(stars)}
                className={`absolute inset-0 size-4 cursor-pointer appearance-none rounded-full border transition-transform duration-150 active:scale-90 ${
                  rating === stars ? "border-bg-brand" : "border-border-strong"
                }`}
              />
              {rating === stars && (
                <span className="pointer-events-none size-2 rounded-full bg-bg-brand" />
              )}
            </span>
            <span className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => (
                <StarIcon
                  key={index}
                  className={`size-4 transition-colors duration-150 ${index < stars ? "text-icon-warning" : "text-icon-tertiary"}`}
                />
              ))}
            </span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title={t("services.filters.price", { symbol: currencySymbol })} defaultOpen={priceTouched}>
        <div className="flex items-center justify-between text-sm text-text-primary">
          <span>{priceBounds.min}</span>
          <span>{priceBounds.max.toLocaleString()}</span>
        </div>
        <Slider
          min={priceBounds.min}
          max={priceBounds.max}
          step={10}
          value={priceRange}
          onValueChange={(value) => setPriceRange([value[0], value[1]])}
          onValueCommit={(value) => {
            setCommittedPriceRange([value[0], value[1]]);
            setPriceTouched(true);
          }}
          className="py-1"
        />
        <div className="flex items-center justify-between text-sm font-medium text-text-brand">
          <span>{priceRange[0].toLocaleString()}</span>
          <span>{priceRange[1].toLocaleString()}</span>
        </div>
      </FilterSection>
    </FilterSidebar>
  );
}
