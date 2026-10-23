"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { AppliedFilter } from "@/components/layout/applied-filters-bar";
import { useTranslation } from "@/lib/i18n/translation-context";

export function AppliedFiltersModal({
  open,
  onOpenChange,
  filters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AppliedFilter[];
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-[480px] flex-col gap-4 p-6 duration-200 ease-out data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2">
        <DialogTitle className="shrink-0 text-base font-medium text-text-primary">
          {t("common.appliedFilters")}
        </DialogTitle>

        <div className="flex flex-wrap items-center gap-3 overflow-y-auto">
          {filters.map((filter) => (
            <span
              key={filter.key}
              className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary"
            >
              {filter.label}
              <button type="button" onClick={filter.onRemove} aria-label={filter.label}>
                <X className="size-4 text-icon-primary" />
              </button>
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
