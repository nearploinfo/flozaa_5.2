"use client";

import { Link } from "@/components/ui/locale-link";
import { ArrowRight } from "lucide-react";
import type { CategoryTreeNode } from "@/lib/categories-tree-api";
import { AppTag } from "@/components/ui/app-tag";
import { AppImage } from "@/components/ui/app-image";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCategoryDetailsViewType } from "@/lib/use-category-details-view-type";

export function CategoryCard({ category }: { category: CategoryTreeNode }) {
  const { t } = useTranslation();
  const viewType = useCategoryDetailsViewType();
  const count = viewType === "providers" ? category.providerCount : (category.serviceCount ?? 0);
  const isComingSoon = count <= 0;
  const basePath = viewType === "providers" ? "/providers" : "/services";

  return (
    <Link
      href={isComingSoon ? "#" : `${basePath}?categories=${category.slug}`}
      aria-disabled={isComingSoon}
      onClick={(event) => {
        if (isComingSoon) event.preventDefault();
      }}
      className={`group relative flex flex-col items-start gap-6 overflow-hidden rounded-xl border border-border-default bg-bg-primary p-4 ${isComingSoon ? "cursor-default" : ""}`}
    >
      {!isComingSoon && (
        <div className="absolute inset-x-0 bottom-0 h-0 bg-bg-brand transition-[height] duration-300 group-hover:top-0 group-hover:h-full" />
      )}

      <span
        className={`relative size-14 shrink-0 overflow-hidden rounded-full bg-bg-secondary transition-colors duration-300 ${!isComingSoon ? "group-hover:bg-bg-primary/20" : ""}`}
      >
        <AppImage
          src={category.image}
          alt={category.name}
          fill
          className="object-contain p-2.5"
        />
      </span>

      <span className="relative flex flex-col gap-1">
        <span
          className={`text-lg font-medium text-text-primary transition-colors duration-300 ${!isComingSoon ? "group-hover:text-white" : ""}`}
        >
          {category.name}
        </span>
        <span
          className={`text-base text-text-secondary transition-colors duration-300 ${!isComingSoon ? "group-hover:text-white/80" : ""}`}
        >
          {isComingSoon
            ? t("common.comingSoon")
            : viewType === "providers"
              ? t("common.providersCount", { count })
              : t("common.servicesCount", { count })}
        </span>
      </span>

      {!isComingSoon && (
        <AppTag
          shape="chip"
          leftIcon={ArrowRight}
          iconClassName="size-5 text-text-primary rtl:rotate-180"
          className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-lg border-0 bg-bg-primary p-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </Link>
  );
}
