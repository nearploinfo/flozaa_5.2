"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

export function MapViewOverlay({
  onClose,
  toolbar,
  filters,
  map,
  children,
}: {
  onClose: () => void;
  toolbar: ReactNode;
  filters: ReactNode;
  /** Real map to render on the right — omit to show the "coming soon" placeholder. */
  map?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary">
      <div className="flex items-center gap-6 border-b border-border-default px-10 py-6">
        <span className="flex-1 text-2xl font-medium text-text-primary">
          {t("common.mapViewTitle")}
        </span>
        <AppButton
          variant="secondary-outline"
          size="md"
          iconOnly
          leftIcon={(iconProps) => <X {...iconProps} />}
          onClick={onClose}
          aria-label={t("common.close")}
        >
          {t("common.close")}
        </AppButton>
      </div>

      {toolbar}

      <div className="flex flex-1 items-start overflow-hidden">
        <div className="flex h-full w-full shrink-0 items-start gap-6 p-6 lg:w-[1100px] lg:border-r lg:border-border-default">
          <div className="thin-scrollbar h-full overflow-y-auto">{filters}</div>
          <div className="thin-scrollbar flex h-full flex-1 flex-col gap-6 overflow-y-auto">
            {children}
          </div>
        </div>
        <div className="hidden h-full flex-1 xl:block">
          {map ?? (
            <div className="flex h-full items-center justify-center bg-bg-secondary">
              <span className="text-lg font-medium text-text-secondary">
                {t("common.mapComingSoon")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
