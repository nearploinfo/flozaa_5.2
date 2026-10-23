"use client";

import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function DatePickerField({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  disabledBefore,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabledBefore?: Date;
}) {
  const [open, setOpen] = useState(false);
  const parsedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-left"
        >
          <span className={cn("flex-1 text-base", selected ? "text-text-primary" : "text-form-field-placeholder")}>
            {selected ? format(selected, "dd/MM/yyyy") : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-form-field-placeholder" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // The month grid (~430px tall) can be taller than the room Radix finds on either
        // side of the trigger when it sits low in a shorter viewport (e.g. a modal's
        // second field on a "Laptop" 1024x768 screen) — without a height cap it renders
        // flipped-and-still-overflowing off the top of the viewport instead of visibly
        // near the trigger. Cap to Radix's own computed available space and scroll.
        className="z-70 flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] flex-row items-center justify-center overflow-y-auto p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={disabledBefore ? { before: disabledBefore } : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
