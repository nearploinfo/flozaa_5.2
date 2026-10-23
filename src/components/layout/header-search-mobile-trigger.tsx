"use client";

import { Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HeaderSearch } from "@/components/layout/header-search";
import { useTranslation } from "@/lib/i18n/translation-context";

export function HeaderSearchMobileTrigger() {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("header.searchPlaceholder")}
        className="flex shrink-0 items-center justify-center rounded-full border border-form-field-border bg-form-field-bg p-2.5"
      >
        <Search className="size-5 text-icon-primary" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-sm">
        <HeaderSearch />
      </PopoverContent>
    </Popover>
  );
}
