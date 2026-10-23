"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import type { ServiceCardData } from "@/lib/services-catalog";
import { ServiceCard } from "@/components/home/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DEFAULT_MOBILE_FILTERS,
  MobileFilterSheet,
  type MobileFiltersValue,
} from "@/components/services/mobile-filter-sheet";
import {
  ProviderFiltersModal,
  defaultProviderFilters,
  type ProviderFiltersValue,
} from "@/components/providers/provider-filters-modal";
import { AppliedFiltersBar, type AppliedFilter } from "@/components/layout/applied-filters-bar";
import { PRICE_MAX, PRICE_MIN } from "@/lib/services-query";
import { Dropdown } from "@/components/ui/dropdown";
import { AppButton } from "@/components/ui/app-button";
import { CategoryDefaultIcon, ChevronRightIcon, ServiceIcon, StarIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

const SORT_LABEL_KEY: Record<string, string> = {
  rating: "services.sort.highlyRated",
  "price-desc": "services.sort.priceHighToLow",
  "price-asc": "services.sort.priceLowToHigh",
};

const DURATION_BUCKET_MINUTES: Record<string, { min?: number; max?: number }> = {
  under30Min: { max: 29 },
  "30to60Min": { min: 30, max: 60 },
  "1to2Hours": { min: 61, max: 120 },
  "2to4Hours": { min: 121, max: 240 },
  "4PlusHours": { min: 241 },
};

function matchesDurations(minutes: number, durations: string[]): boolean {
  if (durations.length === 0) return true;
  return durations.some((key) => {
    const bucket = DURATION_BUCKET_MINUTES[key];
    if (!bucket) return true;
    return (
      (bucket.min === undefined || minutes >= bucket.min) &&
      (bucket.max === undefined || minutes <= bucket.max)
    );
  });
}

/** Slug used for the group's scroll anchor — the Categories sheet jumps to it. */
function categoryAnchorId(category: string): string {
  return `provider-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function groupByCategory(
  services: ServiceCardData[],
  fallbackLabel: string
): { category: string; items: ServiceCardData[] }[] {
  const byCategory = new Map<string, ServiceCardData[]>();
  for (const service of services) {
    const key = service.category || fallbackLabel;
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(service);
    else byCategory.set(key, [service]);
  }
  return [...byCategory].map(([category, items]) => ({ category, items }));
}

function applyFilters(
  services: ServiceCardData[],
  {
    search,
    filters,
  }: { search: string; filters: MobileFiltersValue | ProviderFiltersValue }
): ServiceCardData[] {
  const query = search.trim().toLowerCase();
  const categories = "categories" in filters ? filters.categories : [];
  const filtered = services.filter((service) => {
    if (query && !service.title.toLowerCase().includes(query)) return false;
    if (categories.length > 0 && !categories.includes(service.category)) return false;
    if (filters.rating !== null && service.rating < filters.rating) return false;
    if (filters.priceMax != null && service.price > filters.priceMax) return false;
    return matchesDurations(service.minutes, filters.durations);
  });

  return filters.sort === "rating"
    ? [...filtered].sort((a, b) => b.rating - a.rating)
    : filters.sort === "price-desc"
      ? [...filtered].sort((a, b) => b.price - a.price)
      : filters.sort === "price-asc"
        ? [...filtered].sort((a, b) => a.price - b.price)
        : filtered;
}

export function ProviderServicesSection({
  services,
  priceBounds,
}: {
  services: ServiceCardData[];
  priceBounds?: { min: number; max: number };
}) {
  return (
    <>
      <ProviderServicesMobile services={services} priceBounds={priceBounds} />
      <ProviderServicesDesktop services={services} priceBounds={priceBounds} />
    </>
  );
}

/** lg-and-up layout: search + sort + filters toolbar over collapsible category groups. */
function ProviderServicesDesktop({
  services,
  priceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  services: ServiceCardData[];
  priceBounds?: { min: number; max: number };
}) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ProviderFiltersValue>(defaultProviderFilters());
  const [collapsed, setCollapsed] = useState<string[]>([]);

  // Built from the unfiltered list so the modal's checkboxes stay stable
  // (and keep their counts) even after a filter narrows what's on screen.
  const categoryOptions = useMemo(() => {
    const groups = groupByCategory(services, t("providerDetails.tabs.services"));
    return groups.map(({ category, items }) => ({ name: category, count: items.length }));
  }, [services, t]);

  const groups = useMemo(() => {
    const filtered = applyFilters(services, { search, filters });
    return groupByCategory(filtered, t("providerDetails.tabs.services"));
  }, [services, search, filters, t]);

  const runSearch = () => setSearch(searchInput);
  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const toggleGroup = (category: string) => {
    setCollapsed((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const sortOptions = [
    { label: t("services.sort.all"), value: "all" },
    { label: t("services.sort.highlyRated"), value: "rating" },
    { label: t("services.sort.priceHighToLow"), value: "price-desc" },
    { label: t("services.sort.priceLowToHigh"), value: "price-asc" },
  ];

  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const items: AppliedFilter[] = [];

    if (filters.sort !== null && SORT_LABEL_KEY[filters.sort]) {
      items.push({
        key: "sort",
        label: t(SORT_LABEL_KEY[filters.sort]),
        onRemove: () => setFilters((current) => ({ ...current, sort: null })),
      });
    }

    for (const category of filters.categories) {
      items.push({
        key: `category-${category}`,
        label: category,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            categories: current.categories.filter((value) => value !== category),
          })),
      });
    }

    for (const key of filters.durations) {
      items.push({
        key: `duration-${key}`,
        label: t(`services.filters.durationOptions.${key}`),
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            durations: current.durations.filter((value) => value !== key),
          })),
      });
    }

    if (filters.rating !== null) {
      items.push({
        key: "rating",
        label: t("common.starsCount", { count: filters.rating }),
        onRemove: () => setFilters((current) => ({ ...current, rating: null })),
      });
    }

    if (filters.priceMax != null) {
      items.push({
        key: "price",
        label: `$${priceBounds.min} - $${filters.priceMax}`,
        onRemove: () => setFilters((current) => ({ ...current, priceMax: null })),
      });
    }

    return items;
  }, [filters, t, priceBounds]);

  return (
    <div className="hidden flex-col gap-6 xl:flex">
      <div className="flex flex-col gap-6 rounded-xl border border-border-default bg-bg-primary p-6">
        <div className="flex flex-wrap items-center gap-4">
          <form
            className="relative flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("services.searchPlaceholder")}
              className="w-full rounded-lg border border-border-default bg-bg-secondary p-3 pr-32 text-base text-text-primary outline-none placeholder:text-text-secondary"
            />
            {searchInput !== "" && (
              <AppButton
                type="button"
                variant="link"
                size="sm"
                iconOnly
                leftIcon={X}
                onClick={clearSearch}
                aria-label={t("common.close")}
                className="absolute top-1/2 right-[100] -translate-y-1/2 text-icon-secondary"
              >
                {t("common.clear")}
              </AppButton>
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

          <div className="flex items-center gap-3">
            <span className="text-lg text-text-primary">{t("common.sortBy")}</span>
            <Dropdown
              className="w-52"
              options={sortOptions}
              value={filters.sort ?? "all"}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  sort: value === "all" ? null : (value as ProviderFiltersValue["sort"]),
                }))
              }
            />
          </div>

          <AppButton
            type="button"
            variant="secondary-outline"
            size="md"
            leftIcon={SlidersHorizontal}
            onClick={() => setFiltersOpen(true)}
          >
            {t("providerDetails.services.moreFilters")}
          </AppButton>
        </div>

        <AppliedFiltersBar filters={appliedFilters} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={ServiceIcon}
          title={t("providerDetails.services.emptyTitle")}
          description={t("providerDetails.services.emptyDescription")}
        />
      ) : (
        groups.map(({ category, items }) => {
          const isCollapsed = collapsed.includes(category);
          return (
            <div
              key={category}
              className="flex flex-col overflow-hidden rounded-lg border border-border-default"
            >
              <button
                type="button"
                aria-expanded={!isCollapsed}
                onClick={() => toggleGroup(category)}
                className={`flex items-center justify-center gap-2 border-b border-border-default p-4 ${
                  isCollapsed ? "bg-bg-primary" : "bg-bg-secondary"
                }`}
              >
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-xl font-medium text-text-primary">{category}</span>
                  <span
                    className={`rounded-lg border border-border-default px-3 py-1 text-base text-text-primary ${
                      isCollapsed ? "bg-bg-secondary" : "bg-bg-primary"
                    }`}
                  >
                    {t("common.servicesCount", { count: items.length })}
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: isCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                  className="flex shrink-0 items-center rounded-lg bg-button-secondary-bg p-2"
                >
                  <ChevronDown className="size-6 text-button-secondary-text" />
                </motion.span>
              </button>

              <motion.div
                initial={false}
                animate={{ height: isCollapsed ? 0 : "auto" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden bg-bg-primary"
              >
                <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
                  {items.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </motion.div>
            </div>
          );
        })
      )}

      <ProviderFiltersModal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        categoryOptions={categoryOptions}
        priceBounds={priceBounds}
        onApply={setFilters}
      />
    </div>
  );
}

/** max-lg layout: filter chips over category groups that collapse, plus a Categories jump sheet. */
function ProviderServicesMobile({
  services,
  priceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  services: ServiceCardData[];
  priceBounds?: { min: number; max: number };
}) {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [filters, setFilters] = useState<MobileFiltersValue>(DEFAULT_MOBILE_FILTERS);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const groups = useMemo(() => {
    const filtered = services.filter((service) => {
      if (topRatedOnly && service.rating < 4.5) return false;
      if (filters.rating !== null && service.rating < filters.rating) return false;
      if (filters.priceMax != null && service.price > filters.priceMax) return false;
      return matchesDurations(service.minutes, filters.durations);
    });

    const sorted =
      filters.sort === "rating"
        ? [...filtered].sort((a, b) => b.rating - a.rating)
        : filters.sort === "price-desc"
          ? [...filtered].sort((a, b) => b.price - a.price)
          : filters.sort === "price-asc"
            ? [...filtered].sort((a, b) => a.price - b.price)
            : filtered;

    const byCategory = new Map<string, ServiceCardData[]>();
    for (const service of sorted) {
      const key = service.category || t("providerDetails.tabs.services");
      const bucket = byCategory.get(key);
      if (bucket) bucket.push(service);
      else byCategory.set(key, [service]);
    }
    return [...byCategory].map(([category, items]) => ({ category, items }));
  }, [services, topRatedOnly, filters, t]);

  const visibleCategories = groups.filter(({ category }) =>
    category.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );

  const toggleGroup = (category: string) => {
    setCollapsed((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const jumpToCategory = (category: string) => {
    setCollapsed((current) => current.filter((item) => item !== category));
    setCategoriesOpen(false);
    // Wait for the sheet's close animation before scrolling, otherwise the
    // overlay is still capturing the viewport position.
    requestAnimationFrame(() => {
      document
        .getElementById(categoryAnchorId(category))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="flex flex-col gap-4 xl:hidden">
      <div className="sticky top-25 z-20 -mx-4 flex items-center gap-2 overflow-x-auto bg-bg-secondary px-4 py-2">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-full border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary"
        >
          <SlidersHorizontal className="size-4 text-icon-primary" />
          {t("providerDetails.services.filter")}
        </button>
        <button
          type="button"
          aria-pressed={topRatedOnly}
          onClick={() => setTopRatedOnly((value) => !value)}
          className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm whitespace-nowrap transition-colors duration-200 ${
            topRatedOnly
              ? "border-border-brand bg-bg-brand-subtle text-text-brand"
              : "border-border-default bg-bg-primary text-text-primary"
          }`}
        >
          <StarIcon
            className={`size-4 ${topRatedOnly ? "text-icon-brand" : "text-icon-warning"}`}
          />
          {t("providerDetails.services.topRated")}
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={ServiceIcon}
          title={t("providerDetails.services.emptyTitle")}
          description={t("providerDetails.services.emptyDescription")}
        />
      ) : (
        groups.map(({ category, items }) => {
          const isCollapsed = collapsed.includes(category);
          return (
            <section
              key={category}
              id={categoryAnchorId(category)}
              className="flex scroll-mt-40 flex-col gap-3 rounded-xl bg-bg-primary p-3"
            >
              <button
                type="button"
                aria-expanded={!isCollapsed}
                onClick={() => toggleGroup(category)}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-base font-semibold text-text-primary">
                  {t("providerDetails.services.groupLabel", {
                    name: category,
                    count: items.length,
                  })}
                </span>
                <motion.span
                  animate={{ rotate: isCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                  className="flex shrink-0 items-center"
                >
                  <ChevronDown className="size-5 text-icon-primary" />
                </motion.span>
              </button>

              <motion.div
                initial={false}
                animate={{ height: isCollapsed ? 0 : "auto" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {items.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-xl border border-border-default"
                    >
                      <ServiceCard service={service} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>
          );
        })
      )}

      {groups.length > 0 && (
        <button
          type="button"
          onClick={() => setCategoriesOpen(true)}
          className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-bg-inverse px-4 py-2.5 text-sm font-medium text-text-inverse-dark shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)]"
        >
          <CategoryDefaultIcon className="size-4 text-icon-inverse" />
          {t("providerDetails.services.categories")}
        </button>
      )}

      <Drawer open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <DrawerContent className="bg-bg-primary xl:hidden">
          <DrawerHeader className="border-b border-border-default px-4 pb-3">
            <DrawerTitle className="text-base font-semibold text-text-primary">
              {t("providerDetails.services.categories")}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-3 overflow-y-auto p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-secondary" />
              <input
                type="text"
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder={t("providerDetails.services.searchCategoriesPlaceholder")}
                className="w-full rounded-lg bg-bg-secondary py-2.5 pr-3 pl-9 text-sm text-text-primary outline-none placeholder:text-text-secondary"
              />
            </div>

            <div className="flex flex-col divide-y divide-dashed divide-border-default">
              {visibleCategories.map(({ category, items }) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => jumpToCategory(category)}
                  className="flex items-center gap-3 py-3 text-start"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle">
                    <CategoryDefaultIcon className="size-5 text-icon-brand" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {category}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {t("common.servicesCount", { count: items.length })}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-icon-secondary rtl:rotate-180" />
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <MobileFilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={setFilters}
        priceBounds={priceBounds}
      />
    </div>
  );
}
