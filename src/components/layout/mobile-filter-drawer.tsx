"use client";

import type { ReactNode } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

// Bottom-sheet counterpart to FilterSidebar — same filters component as
// children, just presented as a sheet below `lg` instead of the permanent
// sidebar (which hides itself below `lg`, see filter-sidebar.tsx).
export function MobileFilterDrawer({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-primary xl:hidden">
        <DrawerHeader className="border-b border-border-default px-4 pb-3">
          <DrawerTitle className="text-base font-semibold text-text-primary">{title}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
