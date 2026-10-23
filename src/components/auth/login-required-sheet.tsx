"use client";

import { Info } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Mobile-only interstitial for gated actions/pages — shown before the actual
 * sign-in form (which is full-screen on mobile) so a tap that unexpectedly
 * needs auth doesn't immediately swallow the whole screen. Desktop skips
 * this and opens the sign-in dialog directly (see useRequireAuth/withAuth). */
export function LoginRequiredSheet({
  open,
  onOpenChange,
  onLogin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-primary xl:hidden">
        <DrawerTitle className="sr-only">{t("auth.loginRequired.title")}</DrawerTitle>

        <div className="flex flex-col items-center gap-4 px-4 pt-2 pb-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-bg-brand-subtle">
            <Info className="size-8 text-icon-brand" />
          </span>

          <div className="flex flex-col items-center gap-2 text-center">
            <span className="line-clamp-1 text-base font-bold text-text-primary">
              {t("auth.loginRequired.title")}
            </span>
            <p className="text-xs text-text-secondary">{t("auth.loginRequired.description")}</p>
          </div>

          <div className="flex w-full items-center gap-3">
            <AppButton
              variant="primary-outline"
              size="lg"
              className="flex-1 justify-center bg-bg-brand-subtle"
              onClick={() => onOpenChange(false)}
            >
              {t("auth.loginRequired.close")}
            </AppButton>
            <AppButton
              variant="primary"
              size="lg"
              className="flex-1 justify-center"
              onClick={onLogin}
            >
              {t("auth.loginRequired.login")}
            </AppButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
