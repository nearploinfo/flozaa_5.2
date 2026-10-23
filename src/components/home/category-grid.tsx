"use client";

import { toast } from "sonner";
import { Link } from "@/components/ui/locale-link";
import { DoubleChevronRightIcon } from "@/components/icons/icons";
import type { CategoryTreeNode } from "@/lib/categories-tree-api";
import { CategoryCard } from "@/components/home/category-card";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCategoryDetailsViewType } from "@/lib/use-category-details-view-type";

export function CategoryGrid({
  categories,
  showViewAll = true,
  title,
  description,
  loading = false,
  mobileVariant = "compact",
}: {
  categories: CategoryTreeNode[];
  showViewAll?: boolean;
  title?: string;
  description?: string;
  loading?: boolean;
  mobileVariant?: "compact" | "detailed";
}) {
  const { t } = useTranslation();
  const viewType = useCategoryDetailsViewType();
  const basePath = viewType === "providers" ? "/providers" : "/services";
  const countFor = (category: CategoryTreeNode) =>
    viewType === "providers" ? category.providerCount : (category.serviceCount ?? 0);

  return (
    <>
      {/* Mobile — Figma "Service Category" card, distinct layout from desktop's bordered grid tiles */}
      <div className="flex flex-col items-start gap-3 px-4 xl:hidden commonPY">
        {mobileVariant === "compact" && (
          <div className="flex w-full items-center gap-4">
            <h2 className="flex-1 text-base font-medium text-text-primary">
              {title ?? t("home.categoryGrid.title")}
            </h2>
            {showViewAll && (
              <AppButton
                asChild
                variant="link"
                size="sm"
                className="h-auto shrink-0 p-0 text-sm text-button-link-primary-text hover:text-button-link-primary-text"
              >
                <Link href="/categories">{t("common.viewAll")}</Link>
              </AppButton>
            )}
          </div>
        )}

        {mobileVariant === "compact" ? (
          <div className="grid w-full grid-cols-4 items-start justify-items-center gap-x-2 gap-y-4 rounded-xl bg-bg-primary p-3 lg:grid-cols-6">
            {loading &&
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex w-full flex-col items-center gap-1.5">
                  <Skeleton className="size-10 rounded-full bg-bg-tertiary" />
                  <Skeleton className="h-3 w-full rounded-sm bg-bg-tertiary" />
                </div>
              ))}
            {!loading &&
              categories.slice(0, 8).map((category) => {
                const isComingSoon = countFor(category) <= 0;
                return (
                  <Link
                    key={category.id}
                    href={isComingSoon ? "#" : `${basePath}?categories=${category.slug}`}
                    aria-disabled={isComingSoon}
                    onClick={(event) => {
                      if (isComingSoon) {
                        event.preventDefault();
                        toast(t("common.comingSoon"));
                      }
                    }}
                    className={`flex w-full flex-col items-center gap-1.5 ${isComingSoon ? "cursor-default opacity-50" : ""}`}
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-bg-secondary">
                      <AppImage src={category.image} alt={category.name} fill className="object-contain p-2" />
                    </span>
                    <span className="line-clamp-1 w-full text-center text-xs text-text-primary">
                      {category.name}
                    </span>
                  </Link>
                );
              })}
          </div>
        ) : (
          <div className="grid w-full grid-cols-3 gap-2 md:grid-cols-5">
            {loading &&
              Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-2xl bg-bg-tertiary" />
              ))}
            {!loading &&
              categories.map((category) => {
                const count = countFor(category);
                const isComingSoon = count <= 0;
                return (
                  <Link
                    key={category.id}
                    href={isComingSoon ? "#" : `${basePath}?categories=${category.slug}`}
                    aria-disabled={isComingSoon}
                    onClick={(event) => {
                      if (isComingSoon) event.preventDefault();
                    }}
                    className={`flex h-32 flex-col items-center justify-center gap-2 self-stretch rounded-2xl bg-bg-primary p-2 ${isComingSoon ? "cursor-default" : ""}`}
                  >
                    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-secondary p-3">
                      <AppImage src={category.image} alt={category.name} fill className="object-contain p-3" />
                    </span>
                    <span className="flex w-full flex-col items-center justify-center gap-1">
                      <span className="line-clamp-2 w-full text-center text-xs font-medium text-text-primary">
                        {category.name}
                      </span>
                      <span className="w-full text-center text-xs font-medium text-text-secondary">
                        {isComingSoon
                          ? t("common.comingSoon")
                          : viewType === "providers"
                            ? t("common.providersCount", { count })
                            : t("common.servicesCount", { count })}
                      </span>
                    </span>
                  </Link>
                );
              })}
          </div>
        )}
      </div>

      <section className="container hidden flex-col gap-6 commonPY xl:flex">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title ?? t("home.categoryGrid.title")}</h2>
            <p className="text-base text-text-secondary sm:text-lg">{description ?? t("home.categoryGrid.description")}</p>
          </div>
          {showViewAll && (
            <AppButton
              asChild
              variant="link"
              size="sm"
              className="shrink-0 gap-1 p-0 text-base text-button-link-primary-text hover:text-button-link-primary-text"
            >
              <Link href="/categories">
                <span className="hidden sm:inline">{t("home.categoryGrid.browseAllCategories")}</span>
                <DoubleChevronRightIcon className="size-3.5 rtl:rotate-180" />
              </Link>
            </AppButton>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {loading &&
            Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl bg-bg-tertiary" />
            ))}
          {!loading &&
            categories.map((category) => <CategoryCard key={category.id} category={category} />)}
        </div>
      </section>
    </>
  );
}
