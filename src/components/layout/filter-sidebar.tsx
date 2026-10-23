"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";

export function FilterSidebar({
  onClear,
  hasActiveFilters = false,
  children,
  variant = "sidebar",
}: {
  onClear?: () => void;
  hasActiveFilters?: boolean;
  children: ReactNode;
  /** "sidebar" is the permanent desktop rail (hidden below `lg`); "bare" drops
   * that wrapper/hidden classes so the same filters render visibly inside
   * `MobileFilterDrawer`. */
  variant?: "sidebar" | "bare";
}) {
  if (variant === "bare") {
    return (
      <div className="flex w-full flex-col gap-4">
        {hasActiveFilters && (
          <div className="flex items-center justify-end">
            <AppButton
              variant="link"
              size="sm"
              onClick={onClear}
              className="text-button-link-secondary-focus underline hover:text-button-link-secondary-focus"
            >
              Clear Filter
            </AppButton>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="hidden w-96 shrink-0 flex-col rounded-xl border border-border-default bg-bg-primary xl:flex">
      <div className="flex items-center gap-4 border-b border-border-default p-4">
        <span className="flex-1 text-base text-text-primary">Filters</span>
        {hasActiveFilters && (
          <AppButton
            variant="link"
            size="sm"
            onClick={onClear}
            className="text-button-link-secondary-focus underline hover:text-button-link-secondary-focus"
          >
            Clear Filter
          </AppButton>
        )}
      </div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </div>
  );
}

export function FilterSection({
  title,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  /** Controlled open state — pass alongside `onOpenChange` to make several
   * sections behave as a single-open accordion. Omit both for the default
   * uncontrolled (independently toggled) behavior. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const Chevron = open ? ChevronUpIcon : ChevronDownIcon;

  const toggle = () => {
    const next = !open;
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  };

  return (
    <div className="flex w-full min-h-0 flex-col">
      <AppButton
        variant="link"
        onClick={toggle}
        aria-expanded={open}
        className={`flex w-full items-center gap-4 rounded-xl border border-border-default p-4 text-left ${open ? "bg-bg-secondary" : "bg-bg-primary"}`}
      >
        <span className="flex-1 text-sm font-medium text-text-primary">{title}</span>
        <Chevron className="size-4 shrink-0 text-icon-primary" />
      </AppButton>
      {/* AnimatePresence unmounts the content once the exit animation
       * finishes, instead of leaving a permanent height:0/overflow:hidden
       * node in the DOM. */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-6 p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-bg-secondary">
      <span className="flex-1 text-sm text-text-primary">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 cursor-pointer rounded-sm border border-border-strong accent-bg-brand transition-transform duration-150 active:scale-90"
      />
    </label>
  );
}
