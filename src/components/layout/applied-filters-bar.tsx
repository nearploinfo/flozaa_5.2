"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppliedFiltersModal } from "@/components/layout/applied-filters-modal";
import { useTranslation } from "@/lib/i18n/translation-context";

export interface AppliedFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

const VISIBLE_LIMIT = 10;

function FilterChip({ label, onRemove }: AppliedFilter) {
  return (
    <span className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary">
      {label}
      <button type="button" onClick={onRemove} aria-label={label}>
        <X className="size-4 text-icon-primary" />
      </button>
    </span>
  );
}

export function AppliedFiltersBar({ filters }: { filters: AppliedFilter[] }) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  if (filters.length === 0) return null;

  const visible = filters.slice(0, VISIBLE_LIMIT);
  const overflowCount = filters.length - visible.length;

  return (
    <>
      <div className="flex w-full flex-wrap items-center gap-3">
        {visible.map((filter) => (
          <FilterChip key={filter.key} label={filter.label} onRemove={filter.onRemove} />
        ))}
        {overflowCount > 0 && (
          <AppButton
            variant="link"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="p-0"
          >
            {t("common.moreFilters", { count: overflowCount })}
          </AppButton>
        )}
      </div>
      <AppliedFiltersModal open={modalOpen} onOpenChange={setModalOpen} filters={filters} />
    </>
  );
}
