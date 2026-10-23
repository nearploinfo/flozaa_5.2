"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons/icons";

export interface DropdownOption {
  label: string;
  value: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  className,
  menuClassName,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Overrides the popover's default left-aligned placement (e.g. "right-0 left-auto" near a viewport edge). */
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-md border border-form-field-border px-4 py-2 text-left"
      >
        <span className="flex-1 text-base text-form-field-text">{selected?.label}</span>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-form-field-text transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute left-0 top-[calc(100%+8px)] z-10 flex w-52 flex-col gap-3 rounded-lg border border-border-default bg-bg-primary p-3 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)] ${menuClassName ?? ""}`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="text-left text-sm text-text-primary hover:text-text-brand"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
