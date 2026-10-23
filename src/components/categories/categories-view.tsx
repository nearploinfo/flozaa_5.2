import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { CategoryGrid } from "@/components/home/category-grid";
import { ListingEmptyState } from "@/components/layout/listing-empty-state";
import { LocationModal } from "@/components/layout/location-modal";
import type { CategoryTreeNode } from "@/lib/categories-tree-api";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";

export function CategoriesView({
  categories,
  loading,
}: {
  categories: CategoryTreeNode[];
  loading?: boolean;
}) {
  const hasHydrated = useHasHydrated();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);

  // No saved location and hydration finished — force the location picker
  // instead of showing a dead "no categories found" screen. Same rule as
  // /services and /providers (see services-view.tsx).
  const needsLocation = hasHydrated && savedLat == null && savedLng == null;

  return (
    <div className="flex flex-col">
      <LocationModal open={needsLocation} onOpenChange={() => {}} required />
      <PageBreadcrumb title="Categories" items={[{ label: "Categories" }]} />
      {!loading && categories.length === 0 ? (
        <ListingEmptyState
          title="No categories found"
          message="We couldn't find any categories for your selected location."
          actionLabel="Refresh"
          onAction={() => window.location.reload()}
        />
      ) : (
        <CategoryGrid
          categories={categories}
          showViewAll={false}
          loading={loading}
          mobileVariant="detailed"
        />
      )}
    </div>
  );
}
