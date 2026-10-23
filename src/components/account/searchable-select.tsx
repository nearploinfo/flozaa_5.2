"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppImage } from "@/components/ui/app-image";

export interface SearchableSelectOption {
  id: number | string;
  name: string;
  image?: string;
}

/** Generic search-in-popover picker for long lists (countries, regions) that
 * a plain Select's fixed-height listbox can't usefully hold. Value "" means
 * nothing picked yet — `placeholder` is shown but isn't itself a selectable
 * option; the backend still infers the field from the address coords if the
 * user never picks one, this just doesn't try to guess it in the UI. */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsLabel,
  disabled,
  triggerClassName,
}: {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResultsLabel: string;
  disabled?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => String(option.id) === value) ?? null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.name.toLowerCase().includes(needle));
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={
            (triggerClassName ??
              "flex w-full items-center justify-between gap-2 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text") +
            (disabled ? " cursor-not-allowed opacity-60" : "")
          }
        >
          <span className="flex items-center gap-2 truncate">
            {selected?.image && (
              <AppImage src={selected.image} alt="" className="size-4 shrink-0 rounded-full object-cover" />
            )}
            <span className="truncate">{selected ? selected.name : placeholder}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-icon-secondary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] max-w-none p-0">
        <div className="flex items-center gap-2 border-b border-border-default px-3 py-2">
          <Search className="size-4 shrink-0 text-icon-secondary" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
        <div
          className="max-h-64 overflow-y-auto overscroll-contain p-1"
          // The dialog this popover can live inside locks body scroll via a
          // scroll-lock that only recognizes elements nested under the
          // dialog's own content node — this popover portals to <body>
          // instead, so its wheel events get silently swallowed by that
          // lock. Scroll it manually rather than relying on the browser's
          // default wheel-to-scroll behavior.
          onWheel={(event) => {
            event.currentTarget.scrollTop += event.deltaY;
            event.stopPropagation();
          }}
        >
          {filtered.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(String(option.id));
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-text-primary hover:bg-bg-secondary"
            >
              {option.image && (
                <AppImage src={option.image} alt="" className="size-4 shrink-0 rounded-full object-cover" />
              )}
              <span className="truncate">{option.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-text-tertiary">{noResultsLabel}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
