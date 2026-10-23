"use client";

import { useState } from "react";
import { ChevronDownIcon, MapPinLine } from "@/components/icons/icons";
import { LocationModal } from "@/components/layout/location-modal";
import { AppButton } from "@/components/ui/app-button";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { useTranslation } from "@/lib/i18n/translation-context";

export function LocationPicker({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasHydrated = useHasHydrated();
  const current = useAppSelector((state) => state.location.current);
  const { t } = useTranslation();
  const label = hasHydrated ? (current ?? t("common.addLocation")) : t("common.addLocation");

  if (compact) {
    return (
      <>
        <AppButton
          variant="secondary-outline"
          iconOnly
          leftIcon={MapPinLine}
          aria-label={t("common.setLocation")}
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-full border-form-field-border bg-form-field-bg p-2.5 text-icon-primary"
        >
          {t("common.setLocation")}
        </AppButton>
        <LocationModal open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <AppButton
        variant="link"
        onClick={() => setOpen(true)}
        className="flex w-64 shrink-0 items-center gap-3 rounded-full border border-form-field-border bg-form-field-bg px-3 py-2"
      >
        <span className="flex shrink-0 items-center justify-center rounded-3xl border border-border-default bg-bg-primary p-2">
          <MapPinLine className="size-5 text-icon-primary" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className="text-sm text-form-field-label">{t("common.location")}</span>
          <span className="w-full truncate text-start text-sm font-medium text-form-field-text">
            {label}
          </span>
        </span>
        <span className="flex shrink-0 items-center justify-center rounded-sm p-1">
          <ChevronDownIcon className="size-5 text-button-link-secondary-text" />
        </span>
      </AppButton>
      <LocationModal open={open} onOpenChange={setOpen} />
    </>
  );
}
