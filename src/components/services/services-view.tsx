"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { usePathnameCompat, useSearchParamsCompat } from "@/lib/next-router-compat";
import { Loader2, SearchX } from "lucide-react";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useServicesListing } from "@/lib/use-services-listing";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ListingLayout } from "@/components/layout/listing-layout";
import { ListingToolbar, type ListingViewMode } from "@/components/layout/listing-toolbar";
import {
  AppliedFiltersBar,
  type AppliedFilter,
} from "@/components/layout/applied-filters-bar";
import { MapViewOverlay } from "@/components/layout/map-view-overlay";
import { LocationModal } from "@/components/layout/location-modal";
import { getListingGridClassName } from "@/lib/listing-grid";
import { ListingSkeletonGrid } from "@/components/layout/listing-skeleton-grid";
import { ListingEmptyState } from "@/components/layout/listing-empty-state";
import { MobileFilterDrawer } from "@/components/layout/mobile-filter-drawer";
import { ListingMobileHeader } from "@/components/layout/listing-mobile-header";
import { ListingMobileMapOverlay } from "@/components/layout/listing-mobile-map-overlay";
import { ListingMapView, type ListingMapPin } from "@/components/layout/listing-map-view";
import { CategoryListingHeader } from "@/components/layout/category-listing-header";
import { MobileFilterSheet, type MobileSortValue } from "@/components/services/mobile-filter-sheet";
import {
  ServiceFilters,
  DURATION_OPTION_KEYS,
  type ServiceFiltersValue,
} from "@/components/services/service-filters";
import { expandCategorySlugs, type CategoryTreeNode } from "@/lib/categories-tree-api";
import { ServiceCard } from "@/components/home/service-card";
import { AppButton } from "@/components/ui/app-button";
import { useShowPrice, useCurrencySymbol } from "@/lib/show-price";
import {
  PRICE_MAX,
  PRICE_MIN,
  SORT_VALUE_TO_API,
  buildServicesQueryString,
  type ServicesQueryState,
} from "@/lib/services-query";
import type { ServiceCardData } from "@/lib/services-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";
import { ServiceCardSkeleton } from "@/components/services/service-card-skeleton";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { usePathname } from "next/navigation";

const PAGE_SIZE = 10;

export function ServicesView({
  initialServices,
  initialTotal,
  initialQuery,
  initialLat = null,
  initialLng = null,
  initialPriceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  initialServices: ServiceCardData[];
  initialTotal: number;
  initialQuery: ServicesQueryState;
  initialLat?: number | null;
  initialLng?: number | null;
  initialPriceBounds?: { min: number; max: number };
}) {
  const { t, lang } = useTranslation();
  const currencySymbol = useCurrencySymbol();
  const pathnameUrl = usePathname();
  const isSearchPage = pathnameUrl.includes('search');
  const router = useRouter();
  const pathname = usePathnameCompat();
  const searchParams = useSearchParamsCompat();

  const [sortValue, setSortValue] = useState(initialQuery.sort);
  const [searchInput, setSearchInput] = useState(initialQuery.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.search);
  const [filters, setFilters] = useState<ServiceFiltersValue>({
    categorySlugs: initialQuery.categorySlugs,
    durations: initialQuery.durations,
    rating: initialQuery.rating,
    priceMin: initialQuery.priceMin,
    priceMax: initialQuery.priceMax,
  });
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [viewMode, setViewMode] = useState<ListingViewMode>("list");
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [resetToken, setResetToken] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categoryFiltersOpen, setCategoryFiltersOpen] = useState(false);
  const [payLaterOnly, setPayLaterOnly] = useState(false);

  const hasHydrated = useHasHydrated();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const authToken = useAppSelector((state) => state.auth.token);

  // The location lives in a cookie and the auth token in redux-persist —
  // both are seeded on the CLIENT after mount, so neither exists in the
  // server's render. Reading them during hydration makes isInitialParams
  // disagree across the boundary (server: "params diverged" -> skeletons;
  // client: "same params" -> the SSR cards), which is exactly the hydration
  // mismatch React reported on this grid. Until hasHydrated, use the value
  // SSR itself fetched with so both sides render the same thing; the real
  // one swaps in a tick later, when the query is enabled anyway.
  const queryLat = hasHydrated ? savedLat : initialLat;
  const queryLng = hasHydrated ? savedLng : initialLng;
  const hydratedAuthToken = hasHydrated ? authToken : null;
  const isInitialParams =
    debouncedSearch === initialQuery.search &&
    sortValue === initialQuery.sort &&
    filters.categorySlugs.length === initialQuery.categorySlugs.length &&
    filters.categorySlugs.every((slug, i) => slug === initialQuery.categorySlugs[i]) &&
    filters.durations.length === initialQuery.durations.length &&
    filters.durations.every((d, i) => d === initialQuery.durations[i]) &&
    filters.rating === initialQuery.rating &&
    filters.priceMin === initialQuery.priceMin &&
    filters.priceMax === initialQuery.priceMax &&
    queryLat === initialLat &&
    queryLng === initialLng &&
    !hydratedAuthToken; // SSR's getServerSideProps never attaches an auth token

  // A parent category slug only matches itself, not services tagged under
  // its children — expand to the full subtree before it reaches the API.
  const expandedCategorySlugs = useMemo(
    () => expandCategorySlugs(categoryTree, filters.categorySlugs),
    [filters.categorySlugs, categoryTree]
  );

  const {
    services,
    total,
    priceBounds: queryPriceBounds,
    hasFetched,
    isRefetching: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useServicesListing({
    search: debouncedSearch,
    sort: sortValue,
    sortApi: SORT_VALUE_TO_API[sortValue],
    filters: { ...filters, categorySlugs: expandedCategorySlugs },
    lat: queryLat,
    lng: queryLng,
    authed: Boolean(hydratedAuthToken),
    enabled: hasHydrated && queryLat != null && queryLng != null,
    isInitialParams,
    initialServices,
    initialTotal,
  });
  const priceBounds = queryPriceBounds ?? initialPriceBounds;

  const sentinelRef = useInfiniteScroll({
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: fetchNextPage,
  });

  // Search only runs when the user explicitly submits (Enter or the Search
  // button/icon) — not on every keystroke.
  const handleSearchSubmit = (value?: string) => {
    setDebouncedSearch(value ?? searchInput);
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
  };

  const handleFiltersChange = (value: ServiceFiltersValue) => {
    setFilters(value);
  };

  // Used when a filter is removed from the applied-filters chips bar rather
  // than from the sidebar itself — ServiceFilters only reads `initialFilters`
  // on mount (it's an uncontrolled component), so bumping resetToken forces
  // it to remount with the new values, same trick "Clear All" already uses.
  const removeFilter = (value: ServiceFiltersValue) => {
    setFilters(value);
    setResetToken((token) => token + 1);
  };

  const categoryNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    const visit = (nodes: CategoryTreeNode[]) => {
      for (const node of nodes) {
        map.set(node.slug, node.name);
        if (node.children) visit(node.children);
      }
    };
    visit(categoryTree);
    return map;
  }, [categoryTree]);

  const SORT_LABEL_KEY: Record<string, string> = {
    "price-desc": "services.sort.priceHighToLow",
    "price-asc": "services.sort.priceLowToHigh",
    rating: "services.sort.highlyRated",
  };

  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const items: AppliedFilter[] = [];

    if (sortValue !== "all" && SORT_LABEL_KEY[sortValue]) {
      items.push({
        key: "sort",
        label: t(SORT_LABEL_KEY[sortValue]),
        onRemove: () => setSortValue("all"),
      });
    }

    for (const slug of filters.categorySlugs) {
      items.push({
        key: `category-${slug}`,
        label: categoryNameBySlug.get(slug) ?? slug,
        onRemove: () =>
          removeFilter({
            ...filters,
            categorySlugs: filters.categorySlugs.filter((value) => value !== slug),
          }),
      });
    }

    for (const key of filters.durations) {
      items.push({
        key: `duration-${key}`,
        label: t(`services.filters.durationOptions.${key}`),
        onRemove: () =>
          removeFilter({
            ...filters,
            durations: filters.durations.filter((value) => value !== key),
          }),
      });
    }

    if (filters.rating !== null) {
      items.push({
        key: "rating",
        label: t("common.starsCount", { count: filters.rating }),
        onRemove: () => removeFilter({ ...filters, rating: null }),
      });
    }

    if (filters.priceMin != null || filters.priceMax != null) {
      items.push({
        key: "price",
        label: `${currencySymbol}${filters.priceMin ?? priceBounds.min} - ${currencySymbol}${filters.priceMax ?? priceBounds.max}`,
        onRemove: () => removeFilter({ ...filters, priceMin: null, priceMax: null }),
      });
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, categoryNameBySlug, t, sortValue, priceBounds, currencySymbol]);

  // Reflect the current filter/search/sort state in the URL so it's
  // shareable/bookmarkable and survives back/forward — client-side only
  // (router.replace doesn't trigger a server round-trip or full navigation).
  // Scroll position (how many pages loaded) is deliberately not written
  // back — infinite scroll always resumes from the top on a fresh visit.
  useEffect(() => {
    const qs = buildServicesQueryString({
      search: debouncedSearch,
      sort: sortValue,
      page: 0,
      categorySlugs: filters.categorySlugs,
      durations: filters.durations,
      rating: filters.rating,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
    });
    if (qs === searchParams.toString()) return;
    // Passing a single bare string (e.g. "/services?...") as `url` makes
    // Next's client router re-resolve it against the page table itself —
    // "/services" is only one path segment, which matches the *other*
    // single-segment dynamic route, /[lang] (home), binding lang="services"
    // instead of the real locale. That corrupts router.query.lang for every
    // other component reading it (the nav highlight, most visibly) even
    // though this page's own content stays put since shallow:true skips a
    // remount. Passing `href` as the actual route object (page template +
    // query, including the real `lang`) and `as` as the pretty display URL
    // — Next's documented pattern for masked/dynamic routes — keeps the
    // router's own state correct instead of just the address bar.
    // `shallow: true` is required: without it Next re-runs getServerSideProps
    // on every filter change (a visible extra network round-trip / loading
    // flash) even though this component already owns fetching client-side —
    // the URL update here is purely for share/bookmark/back-forward, not data.
    // router.pathname (not a hardcoded "/[lang]/services") so href always
    // matches whichever page is actually mounted — the default locale
    // renders the bare "/services" wrapper (no "/en" prefix), a different
    // page module from "/[lang]/services". Hardcoding the [lang] variant
    // here made Next treat this as a cross-page navigation from the bare
    // route, remounting ServicesView with default filters mid-session and
    // immediately bouncing the URL back to bare "/services".
    router.replace(
      { pathname: router.pathname, query: { lang, ...Object.fromEntries(new URLSearchParams(qs)) } },
      qs ? `${pathname}?${qs}` : pathname,
      { scroll: false, shallow: true }
    );
  }, [debouncedSearch, sortValue, filters, pathname, router, searchParams, lang]);

  const resetFilters = () => {
    setSortValue("all");
    setSearchInput("");
    setDebouncedSearch("");
    setFilters({ categorySlugs: [], durations: [], rating: null, priceMin: null, priceMax: null });
    // Remount ServiceFilters so its internal checkbox/radio UI state clears too.
    setResetToken((value) => value + 1);
  };

  // No saved location and hydration finished — the server-side fetch ran
  // location-less and came back empty, so force the location picker instead
  // of showing a dead "no services found" screen.
  const needsLocation = hasHydrated && savedLat == null && savedLng == null;
  const locationGate = (
    <LocationModal open={needsLocation} onOpenChange={() => { }} required />
  );

  // A category-card link lands here with exactly one preselected category
  // slug and no free-text search — that combination is the signal for the
  // condensed "browsing a category" mobile layout (see providers-view.tsx
  // for the identical rule on /providers).
  const activeCategorySlug =
    filters.categorySlugs.length === 1 ? filters.categorySlugs[0] : null;
  const isCategoryMode = activeCategorySlug !== null;
  const categoryTitle = activeCategorySlug
    ? (categoryNameBySlug.get(activeCategorySlug) ?? activeCategorySlug)
    : "";
  const startingPrice =
    services.length > 0 ? Math.min(...services.map((service) => service.price)) : null;
  const startingPriceText = useShowPrice(startingPrice);

  const toolbarNode = (
    <ListingToolbar
      resultsLabel={t("services.showingResults", { count: services.length, total })}
      sortOptions={[
        { label: t("services.sort.all"), value: "all" },
        { label: t("services.sort.priceHighToLow"), value: "price-desc" },
        { label: t("services.sort.priceLowToHigh"), value: "price-asc" },
        { label: t("services.sort.highlyRated"), value: "rating" },
      ]}
      sortValue={sortValue}
      onSortChange={handleSortChange}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      onSearchSubmit={handleSearchSubmit}
      searchPlaceholder={t("services.searchPlaceholder")}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      appliedFilters={<AppliedFiltersBar filters={appliedFilters} />}
      variant={viewMode === "map" ? "flat" : "card"}
      onOpenFilters={() => setMobileFiltersOpen(true)}
    />
  );

  const filtersNode = (
    <ServiceFilters
      key={resetToken}
      initialFilters={filters}
      onFiltersChange={handleFiltersChange}
      onCategoryTreeChange={setCategoryTree}
      priceBounds={priceBounds}
    />
  );

  const mobileFiltersDrawer = (
    <MobileFilterDrawer
      title={t("services.filters.filterBy")}
      open={mobileFiltersOpen}
      onOpenChange={setMobileFiltersOpen}
    >
      <ServiceFilters
        key={resetToken}
        variant="bare"
        initialFilters={filters}
        onFiltersChange={handleFiltersChange}
        onCategoryTreeChange={setCategoryTree}
        priceBounds={priceBounds}
      />
    </MobileFilterDrawer>
  );

  const listContent = !hasFetched ? (
    <ListingSkeletonGrid columns={1} viewMode={viewMode} count={PAGE_SIZE} Skeleton={ServiceCardSkeleton} />
  ) : services.length === 0 ? (
    <ListingEmptyState
      title={t("services.noResultsTitle")}
      message={t("services.noResults")}
      actionLabel={t("services.clearFiltersAction")}
      onAction={resetFilters}
    />
  ) : (
    <div className={getListingGridClassName(1, viewMode)}>
      {services.map((service) => (
        <div key={service.id} id={`service-${service.id}`}>
          <ServiceCard
            service={service}
            active={viewMode === "map" && selectedMapIds.includes(service.id)}
          />
        </div>
      ))}
    </div>
  );

  if (viewMode === "map") {
    const pins: ListingMapPin[] = services
      .filter((service) => service.lat !== undefined && service.lng !== undefined)
      .map((service) => ({
        id: service.id,
        position: { lat: service.lat as number, lng: service.lng as number },
        href: `/service-details/${service.id}`,
      }));

    return (
      <>
        <ListingMobileMapOverlay
          kind="service"
          pins={pins}
          selectedIds={selectedMapIds}
          onSelect={(ids) => {
            setSelectedMapIds(ids);
            document
              .getElementById(`mobile-service-${ids[0]}`)
              ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }}
          onDeselect={() => setSelectedMapIds([])}
          savedLat={savedLat}
          savedLng={savedLng}
          onClose={() => setViewMode("list")}
          cardsRow={services.map((service) => (
            <div key={service.id} id={`mobile-service-${service.id}`} className="w-72 shrink-0">
              <ServiceCard service={service} active={selectedMapIds.includes(service.id)} />
            </div>
          ))}
        />
        <div className="hidden xl:block">
          <MapViewOverlay
            onClose={() => setViewMode("list")}
            toolbar={toolbarNode}
            filters={filtersNode}
            map={
              <ListingMapView
                pins={pins}
                kind="service"
                selectedIds={selectedMapIds}
                onSelect={(ids) => {
                  setSelectedMapIds(ids);
                  document
                    .getElementById(`service-${ids[0]}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                onDeselect={() => setSelectedMapIds([])}
                savedLat={savedLat}
                savedLng={savedLng}
              />
            }
          >
            {listContent}
          </MapViewOverlay>
        </div>
        {locationGate}
        {mobileFiltersDrawer}
      </>
    );
  }

  const paginationNode = hasFetched && services.length > 0 && hasMore && (
    <div ref={sentinelRef} className="flex items-center justify-center py-4">
      {loadingMore && <Loader2 className="size-5 animate-spin text-icon-secondary" />}
    </div>
  );

  return (
    <div className="flex flex-col">
      {locationGate}
      {mobileFiltersDrawer}

      {isCategoryMode ? (
        <>
          <CategoryListingHeader
            title={categoryTitle}
            countLabel={t("common.servicesCount", { count: total })}
            startingPriceText={startingPrice !== null ? startingPriceText : null}
            onOpenMap={() => setViewMode("map")}
            payLaterActive={payLaterOnly}
            onTogglePayLater={() => setPayLaterOnly((value) => !value)}
            topRatedActive={filters.rating !== null}
            onToggleTopRated={() => handleFiltersChange({ ...filters, rating: filters.rating ? null : 4 })}
            onOpenFilters={() => setCategoryFiltersOpen(true)}
          >
            <div className={loading ? "pointer-events-none opacity-50" : ""}>{listContent}</div>
            {paginationNode}
          </CategoryListingHeader>
          <MobileFilterSheet
            open={categoryFiltersOpen}
            onOpenChange={setCategoryFiltersOpen}
            priceBounds={priceBounds}
            value={{
              sort: sortValue === "all" ? null : (sortValue as MobileSortValue),
              rating: filters.rating,
              priceMax: filters.priceMax,
              durations: filters.durations,
            }}
            onApply={(next) => {
              setSortValue(next.sort ?? "all");
              handleFiltersChange({ ...filters, rating: next.rating, priceMax: next.priceMax, durations: next.durations });
            }}
          />
        </>
      ) : (
        <>
          <ListingMobileHeader
            title={t("search.explore")}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={handleSearchSubmit}
            searchPlaceholder={t("services.searchPlaceholder")}
            onOpenFilters={() => setMobileFiltersOpen(true)}
            activeTab="services"
            tabHref={`/providers${searchInput ? `?q=${encodeURIComponent(searchInput)}` : ""}`}
            showTabs={searchParams.toString().length > 0}
          />
          <div className="container flex flex-1 flex-col gap-3 bg-bg-secondary pb-6 xl:hidden pt-6">
            {
              isSearchPage &&
              <h1 className="text-base font-semibold text-text-primary">
                {t("search.exploreServices")}
              </h1>
            }
            <div className={loading ? "pointer-events-none opacity-50" : ""}>{listContent}</div>
            {paginationNode}
          </div>
        </>
      )}

      <div className="hidden xl:flex xl:flex-col">
        <PageBreadcrumb title={t("services.title")} items={[{ label: t("services.title") }]} />
        <ListingLayout toolbar={toolbarNode} filters={filtersNode} contentClassName="flex flex-1 flex-col gap-6">
          <div
            className={`flex flex-1 flex-col gap-6 transition-opacity duration-200 ${loading ? "pointer-events-none opacity-50" : "opacity-100"}`}
          >
            {listContent}
          </div>
          {paginationNode}
        </ListingLayout>
      </div>
    </div>
  );
}
