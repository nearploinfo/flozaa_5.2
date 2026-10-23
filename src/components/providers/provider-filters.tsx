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
import type { ServiceMode } from "@/lib/providers-catalog";
import {
  DISTANCE_OPTION_KEYS,
  PRICE_MAX,
  PRICE_MIN,
  SERVICE_MODE_OPTIONS,
} from "@/lib/providers-query";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCurrencySymbol } from "@/lib/show-price";

const RATING_OPTIONS = [5, 4, 3, 2, 1];

export interface ProviderFiltersValue {
  categorySlugs: string[];
  serviceModes: ServiceMode[];
  distanceRanges: string[];
  rating: number | null;
  // null = no price filter applied — see the note in lib/providers-query.ts.
  priceMin: number | null;
  priceMax: number | null;
}

export function ProviderFilters({
  initialFilters,
  onFiltersChange,
  onCategoryTreeChange,
  variant,
  priceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  initialFilters?: ProviderFiltersValue;
  onFiltersChange?: (filters: ProviderFiltersValue) => void;
  onCategoryTreeChange?: (tree: CategoryTreeNode[]) => void;
  variant?: "sidebar" | "bare";
  /** Real price range from the API (get_all_providers' service_min_price/
   * service_max_price) — sizes the slider so services priced above the
   * static PRICE_MAX fallback are still reachable. */
  priceBounds?: { min: number; max: number };
}) {
  const { t } = useTranslation();
  const currencySymbol = useCurrencySymbol();
  const [categories, setCategories] = useState<Set<string>>(
    () => new Set(initialFilters?.categorySlugs)
  );
  const [serviceModes, setServiceModes] = useState<ServiceMode[]>(
    () => initialFilters?.serviceModes ?? []
  );
  const [distances, setDistances] = useState<string[]>(
    () => initialFilters?.distanceRanges ?? []
  );
  const [rating, setRating] = useState<number | null>(() => initialFilters?.rating ?? null);
  const initialPriceRange: [number, number] = [
    initialFilters?.priceMin ?? priceBounds.min,
    initialFilters?.priceMax ?? priceBounds.max,
  ];
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

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onFiltersChange?.({
      categorySlugs: [...categories],
      serviceModes,
      distanceRanges: distances,
      rating,
      priceMin: priceTouched ? committedPriceRange[0] : null,
      priceMax: priceTouched ? committedPriceRange[1] : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, serviceModes, distances, rating, committedPriceRange, priceTouched]);

  const toggle = <T,>(list: T[], value: T, setList: (value: T[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
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
    setServiceModes([]);
    setDistances([]);
    setRating(null);
    setPriceRange([priceBounds.min, priceBounds.max]);
    setCommittedPriceRange([priceBounds.min, priceBounds.max]);
    setPriceTouched(false);
  };

  const hasActiveFilters =
    categories.size > 0 ||
    serviceModes.length > 0 ||
    distances.length > 0 ||
    rating !== null ||
    priceTouched;

  return (
    <FilterSidebar onClear={clearAll} hasActiveFilters={hasActiveFilters} variant={variant}>
      <FilterSection title={t("providerDetails.filters.categories")} defaultOpen={categories.size > 0}>
        <CategoryFilterTree
          categories={categoryTree}
          selected={categories}
          onToggleSelect={toggleCategory}
        />
      </FilterSection>

      <FilterSection title={t("providerDetails.filters.serviceMode")} defaultOpen={serviceModes.length > 0}>
        {SERVICE_MODE_OPTIONS.map(({ key, value }) => (
          <FilterCheckbox
            key={key}
            label={t(`providerDetails.filters.serviceModeOptions.${key}`)}
            checked={serviceModes.includes(value)}
            onChange={() => toggle(serviceModes, value, setServiceModes)}
          />
        ))}
      </FilterSection>

      <FilterSection title={t("providerDetails.filters.distance")} defaultOpen={distances.length > 0}>
        {DISTANCE_OPTION_KEYS.map((key) => (
          <FilterCheckbox
            key={key}
            label={t(`providerDetails.filters.distanceOptions.${key}`)}
            checked={distances.includes(key)}
            onChange={() => toggle(distances, key, setDistances)}
          />
        ))}
      </FilterSection>

      <FilterSection title={t("providerDetails.filters.ratings")} defaultOpen={rating !== null}>
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

      <FilterSection title={t("providerDetails.filters.price", { symbol: currencySymbol })} defaultOpen={priceTouched}>
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
