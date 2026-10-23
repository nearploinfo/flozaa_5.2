"use client";

import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDownIcon, ChevronRightIcon, CloseIcon, ArrowLeftIcon } from "@/components/icons/icons";
import { allCategoriesHierarchicalApi } from "@/api/apiRoutes";
import { toCategoryTreeNode, type CategoryHierarchicalApi, type CategoryTreeNode } from "@/lib/categories-tree-api";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

export function CategoryPickerField({
  value,
  onChange,
}: {
  value: CategoryTreeNode | null;
  onChange: (category: CategoryTreeNode) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<CategoryTreeNode[]>([]);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    setLoading(true);
    allCategoriesHierarchicalApi({}).then((response) => {
      const list: CategoryHierarchicalApi[] = response?.error ? [] : (response?.data ?? []);
      setCategories(list.map(toCategoryTreeNode));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once per modal lifetime, not on every categories.length change
  }, [open]);

  const currentLevel = path.length > 0 ? (path[path.length - 1].children ?? []) : categories;

  const selectNode = (node: CategoryTreeNode) => {
    onChange(node);
    setOpen(false);
    setPath([]);
  };

  const drillInto = (node: CategoryTreeNode) => {
    setPath((prev) => [...prev, node]);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPath([]);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-left"
        >
          <span className={cn("flex-1 text-base", value ? "text-text-primary" : "text-form-field-placeholder")}>
            {value ? value.name : t("requestServiceModal.categoryPlaceholder")}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-form-field-placeholder" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] flex-col gap-0 overflow-hidden rounded-lg p-0 shadow-md"
      >
        <div className="flex w-full items-center gap-4 bg-bg-secondary px-4 py-3">
          <span className="flex-1 text-lg font-medium text-text-primary">
            {t("requestServiceModal.chooseCategory")}
          </span>
          {path.length > 0 && (
            <AppButton
              variant="link"
              size="sm"
              leftIcon={ArrowLeftIcon}
              onClick={() => setPath((prev) => prev.slice(0, -1))}
            >
              {t("requestServiceModal.back")}
            </AppButton>
          )}
          <AppButton
            variant="secondary-outline"
            size="sm"
            iconOnly
            leftIcon={CloseIcon}
            onClick={() => setOpen(false)}
            aria-label={t("requestServiceModal.closeAriaLabel")}
          >
            {t("requestServiceModal.closeAriaLabel")}
          </AppButton>
        </div>

        {path.length > 0 && (
          <div className="flex w-full items-center border-b border-border-default p-4">
            <span className="flex flex-wrap items-center gap-2 rounded-xl bg-bg-secondary px-3 py-1.5 text-base text-text-primary">
              {path.map((node, index) => (
                <span key={node.id} className="flex items-center gap-2">
                  {index > 0 && <ChevronRightIcon className="size-4 text-icon-secondary rtl:rotate-180" />}
                  {node.name}
                </span>
              ))}
            </span>
          </div>
        )}

        <div className="flex max-h-72 w-full flex-col items-start gap-0 overflow-y-auto p-3">
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex w-full items-center p-3">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          {!loading &&
            currentLevel.map((node) => {
            const hasChildren = Boolean(node.children?.length);
            return (
              <div
                key={node.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl hover:bg-bg-secondary",
                  value?.id === node.id && "bg-bg-secondary"
                )}
              >
                <button
                  type="button"
                  onClick={() => selectNode(node)}
                  className="flex-1 p-3 text-left text-base text-text-primary outline-none"
                >
                  {node.name}
                </button>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => drillInto(node)}
                    aria-label={node.name}
                    className="flex items-center justify-center p-3 outline-none"
                  >
                    <ChevronRightIcon className="size-4 text-icon-secondary rtl:rotate-180" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
