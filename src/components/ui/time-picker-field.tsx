"use client";

import { useMemo, useRef, useState } from "react";
import { format, parse, isValid } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppButton } from "@/components/ui/app-button";
import { ClockIcon } from "@/components/icons/icons";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const PERIODS = ["AM", "PM"] as const;

/** Falls back to `defaultTime` (typically the "now" floor passed as minTime) when no value is
 * picked yet, so the columns open already scrolled to and highlighting the current time
 * instead of an arbitrary 12:00 AM — the field still shows its placeholder until the user
 * actually taps a slot, this only affects what's pre-highlighted inside the open picker. */
function parseValue(value: string, defaultTime?: string): { hour: number; minute: number; period: "AM" | "PM" } {
  const parsed = value ? parse(value, "HH:mm", new Date()) : defaultTime ? parse(defaultTime, "HH:mm", new Date()) : null;
  if (!parsed || !isValid(parsed)) return { hour: 12, minute: 0, period: "AM" };
  const hours24 = parsed.getHours();
  return {
    hour: hours24 % 12 || 12,
    minute: parsed.getMinutes(),
    period: hours24 >= 12 ? "PM" : "AM",
  };
}

function toHours24(hour: number, period: "AM" | "PM"): number {
  return period === "AM" ? hour % 12 : (hour % 12) + 12;
}

function toValue(hour: number, minute: number, period: "AM" | "PM"): string {
  return `${String(toHours24(hour, period)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function TimeColumn<T extends number | string>({
  items,
  selected,
  onSelect,
  format: formatItem,
  isDisabled,
}: {
  items: T[];
  selected: T;
  onSelect: (item: T) => void;
  format: (item: T) => string;
  isDisabled?: (item: T) => boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="thin-scrollbar flex h-64 flex-1 flex-col items-stretch overflow-y-auto"
      onWheel={(event) => {
        // Radix's Dialog scroll-lock intercepts wheel events at the document
        // level and calls preventDefault before this handler runs, since
        // this popover is a separate portal outside the dialog's tracked
        // subtree — so native scrolling never kicks in. Move it manually.
        if (ref.current) ref.current.scrollTop += event.deltaY;
      }}
    >
      {items.map((item) => {
        const isSelected = item === selected;
        const disabled = isDisabled?.(item) ?? false;
        return (
          <button
            key={item}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item)}
            className={cn(
              "shrink-0 px-3 py-2 text-center text-sm outline-none hover:bg-bg-secondary",
              isSelected && "bg-bg-brand-subtle font-medium text-text-brand",
              disabled && "cursor-not-allowed text-text-secondary opacity-40 hover:bg-transparent"
            )}
          >
            {formatItem(item)}
          </button>
        );
      })}
    </div>
  );
}

export function TimePickerField({
  value,
  onChange,
  placeholder = "--:-- --",
  minTime,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "HH:mm" (24h) — disables any slot earlier than this, e.g. "now" when the paired date is today. */
  minTime?: string;
}) {
  const [open, setOpen] = useState(false);
  const { hour, minute, period } = useMemo(() => parseValue(value, minTime), [value, minTime]);

  const min = useMemo(() => {
    if (!minTime) return null;
    const parsed = parse(minTime, "HH:mm", new Date());
    if (!isValid(parsed)) return null;
    return { hours24: parsed.getHours(), minutes: parsed.getMinutes() };
  }, [minTime]);

  const label = useMemo(() => {
    if (!value) return null;
    const parsed = parse(value, "HH:mm", new Date());
    return isValid(parsed) ? format(parsed, "hh:mm a") : null;
  }, [value]);

  const isHourDisabled = (h: number) => {
    if (!min) return false;
    return toHours24(h, period) < min.hours24;
  };
  const isMinuteDisabled = (m: number) => {
    if (!min) return false;
    const hours24 = toHours24(hour, period);
    return hours24 < min.hours24 || (hours24 === min.hours24 && m < min.minutes);
  };
  const isPeriodDisabled = (p: "AM" | "PM") => {
    if (!min) return false;
    // Every AM hour (00–11) is behind "now" once "now" has moved into the PM half of the day.
    return p === "AM" && min.hours24 >= 12;
  };

  // The current wall-clock time, not whatever's already selected — picking
  // a slot in the columns never counts as "Now" once a minute passes.
  const handleNow = () => {
    onChange(format(new Date(), "HH:mm"));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-left"
        >
          <span className={cn("flex-1 text-base", label ? "text-text-primary" : "text-form-field-placeholder")}>
            {label ?? placeholder}
          </span>
          <ClockIcon className="size-4 shrink-0 text-form-field-placeholder" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-70 flex w-[var(--radix-popover-trigger-width)] flex-col p-0"
      >
        <div className="flex flex-row divide-x divide-border-default">
          <TimeColumn
            items={HOURS}
            selected={hour}
            onSelect={(h) => onChange(toValue(h, minute, period))}
            format={(h) => String(h).padStart(2, "0")}
            isDisabled={isHourDisabled}
          />
          <TimeColumn
            items={MINUTES}
            selected={minute}
            onSelect={(m) => onChange(toValue(hour, m, period))}
            format={(m) => String(m).padStart(2, "0")}
            isDisabled={isMinuteDisabled}
          />
          <TimeColumn
            items={[...PERIODS]}
            selected={period}
            onSelect={(p) => onChange(toValue(hour, minute, p as "AM" | "PM"))}
            format={(p) => p}
            isDisabled={isPeriodDisabled}
          />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border-default p-2">
          <AppButton
            type="button"
            variant="secondary-outline"
            size="sm"
            className="rounded-md"
            onClick={handleNow}
          >
            Now
          </AppButton>
          <AppButton
            type="button"
            variant="primary"
            size="sm"
            className="rounded-md"
            onClick={() => setOpen(false)}
          >
            Done
          </AppButton>
        </div>
      </PopoverContent>
    </Popover>
  );
}
