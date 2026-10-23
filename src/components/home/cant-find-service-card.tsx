"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { RequestServiceModal } from "@/components/layout/request-service-modal";
import { MobileRequestServiceScreen } from "@/components/layout/mobile-request-service-screen";
import { useIsMobile } from "@/lib/use-is-mobile";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Mobile-only CTA dropped in among the home page's backend-driven sections
 * (see section-renderer.tsx) — desktop already has the header's "Request a
 * Service" button, so this doesn't render there. */
export function CantFindServiceCard() {
  const { t } = useTranslation();
  const { requireAuth } = useRequireAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="container xl:hidden">
        <div className="relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-2xl bg-bg-brand-subtle px-2 py-4 shadow-[0px_2px_8px_0px_rgba(9,30,66,0.08)]">
          <div className="absolute -top-12 -right-12 size-32 rounded-full bg-bg-brand opacity-10" />
          <div className="absolute -bottom-12 -left-12 size-24 rounded-full bg-bg-brand opacity-10" />

          <div className="flex flex-col items-center gap-1">
            <span className="text-center text-base font-bold text-text-primary">
              {t("home.cantFindService.title")}
            </span>
            <span className="text-center text-xs text-text-primary">{t("home.cantFindService.description")}</span>
          </div>

          <AppButton
            variant="primary"
            size="sm"
            className="rounded-lg p-2"
            onClick={() => requireAuth(() => setOpen(true))}
          >
            {t("home.cantFindService.cta")}
          </AppButton>
        </div>
      </div>

      {isMobile ? (
        <MobileRequestServiceScreen open={open} onOpenChange={setOpen} />
      ) : (
        <RequestServiceModal open={open} onOpenChange={setOpen} />
      )}
    </>
  );
}
