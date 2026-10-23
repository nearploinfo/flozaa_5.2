"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { usePathnameCompat, useSearchParamsCompat } from "@/lib/next-router-compat";
import { Loader2, SearchX } from "lucide-react";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useProvidersListing } from "@/lib/use-providers-listing";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ListingLayout } from "@/components/layout/listing-layout";
import { ListingToolbar, type ListingViewMode } from "@/components/layout/listing-toolbar";
import {
  AppliedFiltersBar,
  type AppliedFilter,
} from "@/components/layout/applied-filters-bar";
import { MapViewOverlay } from "@/components/layout/map-view-overlay";
import { LocationModal } from "@/components/layout/location-modal";
import { MobileFilterDrawer } from "@/components/layout/mobile-filter-drawer";
import { ListingMobileHeader } from "@/components/layout/listing-mobile-header";
import { ListingMobileMapOverlay } from "@/components/layout/listing-mobile-map-overlay";
import { getListingGridClassName } from "@/lib/listing-grid";
import { ListingSkeletonGrid } from "@/components/layout/listing-skeleton-grid";
import { ListingEmptyState } from "@/components/layout/listing-empty-state";
import { ListingMapView, type ListingMapPin } from "@/components/layout/listing-map-view";
import { CategoryListingHeader } from "@/components/layout/category-listing-header";
import {
  ProviderMobileFilterSheet,
  type ProviderMobileSortValue,
} from "@/components/providers/mobile-filter-sheet";
import { ProviderFilters, type ProviderFiltersValue } from "@/components/providers/provider-filters";
import { expandCategorySlugs, type CategoryTreeNode } from "@/lib/categories-tree-api";
import { SERVICE_MODE_OPTIONS } from "@/lib/providers-query";
import { ProviderCard } from "@/components/home/provider-card";
import { useShowPrice, useCurrencySymbol } from "@/lib/show-price";
import {
  PRICE_MAX,
  PRICE_MIN,
  SORT_VALUE_TO_API,
  buildProvidersQueryString,
  type ProvidersQueryState,
} from "@/lib/providers-query";
import type { NearbyProvider } from "@/lib/providers-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";
import { ServiceCardSkeleton } from "@/components/services/service-card-skeleton";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { usePathname } from "next/navigation";

const PAGE_SIZE = 9;

export function ProvidersView({
  initialProviders,
  initialTotal,
  initialQuery,
  initialLat = null,
  initialLng = null,
  initialPriceBounds = { min: PRICE_MIN, max: PRICE_MAX },
}: {
  initialProviders: NearbyProvider[];
  initialTotal: number;
  initialQuery: ProvidersQueryState;
  /** Location SSR already used (from the cookie) — lets the client skip a redundant refetch when nothing's changed. */
  initialLat?: number | null;
  initialLng?: number | null;
  initialPriceBounds?: { min: number; max: number };
}) {
  const { t, lang } = useTranslation();
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const pathname = usePathnameCompat();
  const pathnameUrl = usePathname();
  const isSearchPage = pathnameUrl.includes('search');
  const searchParams = useSearchParamsCompat();

  const [sortValue, setSortValue] = useState(initialQuery.sort);
  const [searchInput, setSearchInput] = useState(initialQuery.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.search);
  const [filters, setFilters] = useState<ProviderFiltersValue>({
    categorySlugs: initialQuery.categorySlugs,
    serviceModes: initialQuery.serviceModes,
    distanceRanges: initialQuery.distanceRanges,
    rating: initialQuery.rating,
    priceMin: initialQuery.priceMin,
    priceMax: initialQuery.priceMax,
  });
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [viewMode, setViewMode] = useState<ListingViewMode>("list");
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);

  const hasHydrated = useHasHydrated();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const authToken = useAppSelector((state) => state.auth.token);

  // Same hydration guard as ServicesView: the cookie-seeded location and the
  // redux-persist auth token don't exist in the server's render, so reading
  // them during hydration flips isInitialParams and swaps the SSR cards for
  // skeletons mid-hydration. Until hasHydrated, use the value SSR itself
  // fetched with so both sides render the same thing.
  const queryLat = hasHydrated ? savedLat : initialLat;
  const queryLng = hasHydrated ? savedLng : initialLng;
  const hydratedAuthToken = hasHydrated ? authToken : null;
  const isInitialParams =
    debouncedSearch === initialQuery.search &&
    sortValue === initialQuery.sort &&
    filters.categorySlugs.length === initialQuery.categorySlugs.length &&
    filters.categorySlugs.every((slug, i) => slug === initialQuery.categorySlugs[i]) &&
    filters.serviceModes.length === initialQuery.serviceModes.length &&
    filters.serviceModes.every((mode, i) => mode === initialQuery.serviceModes[i]) &&
    filters.distanceRanges.length === initialQuery.distanceRanges.length &&
    filters.distanceRanges.every((range, i) => range === initialQuery.distanceRanges[i]) &&
    filters.rating === initialQuery.rating &&
    filters.priceMin === initialQuery.priceMin &&
    filters.priceMax === initialQuery.priceMax &&
    queryLat === initialLat &&
    queryLng === initialLng &&
    !hydratedAuthToken; // SSR's getServerSideProps never attaches an auth token

  // A parent category slug only matches itself, not providers tagged under
  // its children — expand to the full subtree before it reaches the API.
  const expandedCategorySlugs = useMemo(
    () => expandCategorySlugs(categoryTree, filters.categorySlugs),
    [filters.categorySlugs, categoryTree]
  );

  const {
    providers,
    total,
    priceBounds: queryPriceBounds,
    hasFetched,
    isRefetching: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useProvidersListing({
    search: debouncedSearch,
    sort: sortValue,
    sortApi: SORT_VALUE_TO_API[sortValue],
    filters: { ...filters, categorySlugs: expandedCategorySlugs },
    lat: queryLat,
    lng: queryLng,
    authed: Boolean(hydratedAuthToken),
    enabled: hasHydrated && queryLat != null && queryLng != null,
    isInitialParams,
    initialProviders,
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

  const handleFiltersChange = (value: ProviderFiltersValue) => {
    setFilters(value);
  };

  // Reflect the current filter/search/sort state in the URL so it's
  // shareable/bookmarkable and survives back/forward — client-side only
  // (router.replace doesn't trigger a server round-trip or full navigation).
  // Scroll position (how many pages loaded) is deliberately not written
  // back — infinite scroll always resumes from the top on a fresh visit.
  useEffect(() => {
    const qs = buildProvidersQueryString({
      search: debouncedSearch,
      sort: sortValue,
      page: 0,
      categorySlugs: filters.categorySlugs,
      serviceModes: filters.serviceModes,
      distanceRanges: filters.distanceRanges,
      rating: filters.rating,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
    });
    if (qs === searchParams.toString()) return;
    // Passing a single bare string (e.g. "/providers?...") as `url` makes
    // Next's client router re-resolve it against the page table itself —
    // "/providers" is only one path segment, which matches the *other*
    // single-segment dynamic route, /[lang] (home), binding lang="providers"
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
    // router.pathname (not a hardcoded "/[lang]/providers") so href always
    // matches whichever page is actually mounted — the default locale
    // renders the bare "/providers" wrapper (no "/en" prefix), a different
    // page module from "/[lang]/providers". Hardcoding the [lang] variant
    // here made Next treat this as a cross-page navigation from the bare
    // route, remounting ProvidersView with default filters mid-session and
    // immediately bouncing the URL back to bare "/providers".
    router.replace(
      { pathname: router.pathname, query: { lang, ...Object.fromEntries(new URLSearchParams(qs)) } },
      qs ? `${pathname}?${qs}` : pathname,
      { scroll: false, shallow: true }
    );
  }, [debouncedSearch, sortValue, filters, pathname, router, searchParams, lang]);

  const [resetToken, setResetToken] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categoryFiltersOpen, setCategoryFiltersOpen] = useState(false);
  const [payLaterOnly, setPayLaterOnly] = useState(false);

  const resetFilters = () => {
    setSortValue("all");
    setSearchInput("");
    setDebouncedSearch("");
    setFilters({
      categorySlugs: [],
      serviceModes: [],
      distanceRanges: [],
      rating: null,
      priceMin: null,
      priceMax: null,
    });
    setResetToken((value) => value + 1);
  };

  // Used when a filter is removed from the applied-filters chips bar rather
  // than from the sidebar itself — ProviderFilters only reads `initialFilters`
  // on mount (it's an uncontrolled component), so bumping resetToken forces
  // it to remount with the new values, same trick "Clear All" already uses.
  const removeFilter = (value: ProviderFiltersValue) => {
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

  const serviceModeLabelKey = useMemo(
    () => new Map(SERVICE_MODE_OPTIONS.map(({ key, value }) => [value, key])),
    []
  );

  const SORT_LABEL_KEY: Record<string, string> = {
    "price-desc": "providers.sort.priceHighToLow",
    "price-asc": "providers.sort.priceLowToHigh",
    rating: "providers.sort.highlyRated",
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

    for (const mode of filters.serviceModes) {
      const optionKey = serviceModeLabelKey.get(mode);
      items.push({
        key: `service-mode-${mode}`,
        label: optionKey ? t(`providerDetails.filters.serviceModeOptions.${optionKey}`) : mode,
        onRemove: () =>
          removeFilter({
            ...filters,
            serviceModes: filters.serviceModes.filter((value) => value !== mode),
          }),
      });
    }

    for (const key of filters.distanceRanges) {
      items.push({
        key: `distance-${key}`,
        label: t(`providerDetails.filters.distanceOptions.${key}`),
        onRemove: () =>
          removeFilter({
            ...filters,
            distanceRanges: filters.distanceRanges.filter((value) => value !== key),
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
  }, [filters, categoryNameBySlug, serviceModeLabelKey, t, sortValue, priceBounds, currencySymbol]);

  // No saved location and hydration finished — the server-side fetch ran
  // location-less and came back empty, so force the location picker instead
  // of showing a dead "no providers found" screen.
  const needsLocation = hasHydrated && savedLat == null && savedLng == null;
  const locationGate = (
    <LocationModal open={needsLocation} onOpenChange={() => { }} required />
  );

  // A category-card link lands here with exactly one preselected category
  // slug and no free-text search — that combination is the signal for the
  // condensed "browsing a category" mobile layout (see services-view.tsx
  // for the identical rule on /services).
  const activeCategorySlug =
    filters.categorySlugs.length === 1 ? filters.categorySlugs[0] : null;
  const isCategoryMode = activeCategorySlug !== null;
  const categoryTitle = activeCategorySlug
    ? (categoryNameBySlug.get(activeCategorySlug) ?? activeCategorySlug)
    : "";
  const startingPrice =
    providers.length > 0 ? Math.min(...providers.map((provider) => provider.startingPrice)) : null;
  const startingPriceText = useShowPrice(startingPrice);

  const toolbarNode = (
    <ListingToolbar
      resultsLabel={t("providers.showingResults", { count: providers.length, total })}
      sortOptions={[
        { label: t("providers.sort.all"), value: "all" },
        { label: t("providers.sort.priceHighToLow"), value: "price-desc" },
        { label: t("providers.sort.priceLowToHigh"), value: "price-asc" },
        { label: t("providers.sort.highlyRated"), value: "rating" },
      ]}
      sortValue={sortValue}
      onSortChange={handleSortChange}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      onSearchSubmit={handleSearchSubmit}
      searchPlaceholder={t("providers.searchPlaceholder")}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      appliedFilters={<AppliedFiltersBar filters={appliedFilters} />}
      variant={viewMode === "map" ? "flat" : "card"}
      onOpenFilters={() => setMobileFiltersOpen(true)}
    />
  );

  const filtersNode = (
    <ProviderFilters
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
      <ProviderFilters
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
    <ListingSkeletonGrid columns={3} viewMode={viewMode} count={PAGE_SIZE} Skeleton={ServiceCardSkeleton} />
  ) : providers.length === 0 ? (
    <ListingEmptyState
      title={t("providers.noResultsTitle")}
      message={t("providers.noResults")}
      actionLabel={t("providers.clearFiltersAction")}
      onAction={resetFilters}
    />
  ) : (
    <div className={getListingGridClassName(3, viewMode)}>
      {providers.map((provider) => (
        <div key={provider.id} id={`provider-${provider.id}`}>
          <ProviderCard
            provider={provider}
            style={viewMode === "map" ? "style-2" : "style-1"}
            active={viewMode === "map" && selectedMapIds.includes(provider.id)}
          />
        </div>
      ))}
    </div>
  );

  if (viewMode === "map") {
    const pins: ListingMapPin[] = providers
      .filter((provider) => provider.lat !== undefined && provider.lng !== undefined)
      .map((provider) => ({
        id: provider.id,
        position: { lat: provider.lat as number, lng: provider.lng as number },
        href: provider.href,
      }));

    return (
      <>
        <ListingMobileMapOverlay
          kind="provider"
          pins={pins}
          selectedIds={selectedMapIds}
          onSelect={(ids) => {
            setSelectedMapIds(ids);
            document
              .getElementById(`mobile-provider-${ids[0]}`)
              ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }}
          onDeselect={() => setSelectedMapIds([])}
          savedLat={savedLat}
          savedLng={savedLng}
          onClose={() => setViewMode("list")}
          cardsRow={providers.map((provider) => (
            <div key={provider.id} id={`mobile-provider-${provider.id}`} className="w-72 shrink-0">
              <ProviderCard provider={provider} style="style-2" active={selectedMapIds.includes(provider.id)} />
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
                kind="provider"
                selectedIds={selectedMapIds}
                onSelect={(ids) => {
                  setSelectedMapIds(ids);
                  document
                    .getElementById(`provider-${ids[0]}`)
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

  const paginationNode = hasFetched && providers.length > 0 && hasMore && (
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
            countLabel={t("common.providersCount", { count: total })}
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
          <ProviderMobileFilterSheet
            open={categoryFiltersOpen}
            onOpenChange={setCategoryFiltersOpen}
            priceBounds={priceBounds}
            value={{
              sort: sortValue === "all" ? null : (sortValue as ProviderMobileSortValue),
              rating: filters.rating,
              priceMax: filters.priceMax,
              serviceModes: filters.serviceModes,
            }}
            onApply={(next) => {
              setSortValue(next.sort ?? "all");
              handleFiltersChange({
                ...filters,
                rating: next.rating,
                priceMax: next.priceMax,
                serviceModes: next.serviceModes,
              });
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
            searchPlaceholder={t("providers.searchPlaceholder")}
            onOpenFilters={() => setMobileFiltersOpen(true)}
            activeTab="providers"
            tabHref={`/services${searchInput ? `?q=${encodeURIComponent(searchInput)}` : ""}`}
            showTabs={searchParams.toString().length > 0}
          />
          <div className="container flex flex-1 flex-col gap-3 bg-bg-secondary pb-6 xl:hidden pt-6">
            {
              isSearchPage &&
              <h1 className="text-base font-semibold text-text-primary">
                {t("search.exploreProviders")}
              </h1>
            }
            <div className={loading ? "pointer-events-none opacity-50" : ""}>{listContent}</div>
            {paginationNode}
          </div>
        </>
      )}

      <div className="hidden xl:flex xl:flex-col">
        <PageBreadcrumb title={t("providers.title")} items={[{ label: t("providers.title") }]} />
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
