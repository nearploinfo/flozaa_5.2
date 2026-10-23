"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { SectionHeading } from "@/components/become-provider/section-heading";
import { ServiceCard } from "@/components/become-provider/service-card";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CategorySectionApi } from "@/lib/become-provider";

const PAGE_SIZE = 6;

export function ServicesGridSection({ data }: { data: CategorySectionApi }) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const categories = data.categories ?? [];

  return (
    <section className="relative bg-bg-secondary">
      <div className="container mx-auto py-8 md:py-20">
        <SectionHeading headline={data} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {categories.slice(0, visibleCount).map((category, index) => (
            <ServiceCard key={category.id} category={category} number={index + 1} />
          ))}
        </div>

        {visibleCount < categories.length && (
          <div className="mt-8 flex justify-center">
            <AppButton variant="secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              {t("becomeProviderPage.loadMore")}
            </AppButton>
          </div>
        )}
      </div>
    </section>
  );
}
