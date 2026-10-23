"use client";

import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "flex items-center gap-1 rounded-sm border border-border-default bg-bg-secondary p-1.5",
        className
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "flex size-7 items-center justify-center rounded-xs text-icon-primary outline-none transition-colors data-[state=on]:bg-bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        className
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
