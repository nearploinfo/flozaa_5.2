"use client";

import type { ReactNode } from "react";
import { Map as MapIcon, SlidersHorizontal } from "lucide-react";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import { StarIcon } from "@/components/icons/icons";
import { FilterChip } from "@/components/ui/filter-chip";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

// Shared below-`lg` chrome for the "browsing a single category" layout on
// /services and /providers — back arrow + category title + Map button, a
// count/starting-price line, the quick-filter chip row, and a "Recommended
// for You" heading wrapping whatever list content the caller passes in. Each
// view still owns its own filter-sheet component (different filter shapes —
// durations vs. service modes) and renders it as a sibling.
export function CategoryListingHeader({
  title,
  countLabel,
  startingPriceText,
  onOpenMap,
  payLaterActive,
  onTogglePayLater,
  topRatedActive,
  onToggleTopRated,
  onOpenFilters,
  children,
}: {
  title: string;
  countLabel: string;
  startingPriceText: string | null;
  onOpenMap: () => void;
  payLaterActive: boolean;
  onTogglePayLater: () => void;
  topRatedActive: boolean;
  onToggleTopRated: () => void;
  onOpenFilters: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col xl:hidden">
      <MobileBreadcrum
        title={title}
        headerAction={
          <AppButton
            variant="secondary-outline"
            size="sm"
            leftIcon={MapIcon}
            className="rounded-lg"
            onClick={onOpenMap}
          >
            {t("common.map")}
          </AppButton>
        }
      />
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <div className="bg-bg-primary pb-3">
          <div className="container">
            <div className="mb-4 -mt-3 flex items-center gap-2 pl-10 text-sm text-text-secondary">
              <span>{countLabel}</span>
              {startingPriceText && (
                <>
                  <span className="size-1 rounded-full bg-text-secondary" />
                  <span>
                    {t("common.startingFrom")} {startingPriceText}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <FilterChip active={false} icon={SlidersHorizontal} onClick={onOpenFilters}>
                {t("common.sortAndFilter")}
              </FilterChip>
              <FilterChip active={payLaterActive} onClick={onTogglePayLater}>
                {t("common.payLater")}
              </FilterChip>
              <FilterChip active={topRatedActive} icon={StarIcon} onClick={onToggleTopRated}>
                {t("providerDetails.services.topRated")}
              </FilterChip>
            </div>
          </div>
        </div>
        <div className="container flex flex-1 flex-col gap-4 bg-bg-secondary">
          <h1 className="text-base font-semibold text-text-primary">
            {t("common.recommendedForYou")}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
