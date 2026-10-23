"use client";

import { BarChart3Icon, CookieIcon, LockIcon, MapPinIcon, MegaphoneIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { AppButton } from "@/components/ui/app-button";
import { useConsent } from "@/lib/consent-context";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCookieConsentSettings } from "@/lib/use-cookie-consent-settings";
import { useIsMobile } from "@/lib/use-is-mobile";
import { useEffect, useState } from "react";
import type { ConsentValue } from "@/lib/cookie-consent";

const CATEGORY_ICONS = {
  functional: MapPinIcon,
  analytics: BarChart3Icon,
  marketing: MegaphoneIcon,
} as const;

export function CookieConsentDialog() {
  const { t } = useTranslation();
  const { consent, showDialog, updateConsent, acceptAll, declineAll, closeDialog } = useConsent();
  const { title: adminTitle, description: adminDescription } = useCookieConsentSettings();
  const [draft, setDraft] = useState<ConsentValue | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- snapshots consent into an editable draft only when the dialog opens, not on every consent change
    if (showDialog) setDraft(consent);
  }, [showDialog, consent]);

  if (!draft) return null;

  const setKey = (key: "functional" | "analytics" | "marketing", value: boolean) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const categories: Array<{ key: "functional" | "analytics" | "marketing"; titleKey: string; descKey: string }> = [
    { key: "functional", titleKey: "cookie.functional.title", descKey: "cookie.functional.description" },
    { key: "analytics", titleKey: "cookie.analytics.title", descKey: "cookie.analytics.description" },
    { key: "marketing", titleKey: "cookie.marketing.title", descKey: "cookie.marketing.description" },
  ];

  const body: ReactNode = (
    <div className="thin-scrollbar flex flex-1 flex-col items-center justify-start gap-4 self-stretch overflow-y-auto px-6 py-4">
      <p className="self-stretch text-sm leading-5 font-normal text-text-secondary">
        {adminDescription || t("cookie.description")}
      </p>

      <div className="flex items-center justify-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-secondary p-3">
        <div className="flex flex-1 flex-col items-start justify-start gap-1">
          <div className="flex items-center justify-start gap-2 self-stretch">
            <LockIcon className="size-5 text-button-secondary-outline-text" />
            <div className="flex-1 text-sm leading-5 font-normal text-text-primary">
              {t("cookie.essential.title")}
            </div>
          </div>
          <div className="text-sm leading-5 font-normal text-text-secondary">
            {t("cookie.essential.description")}
          </div>
        </div>
        <Switch checked disabled />
      </div>

      {categories.map(({ key, titleKey, descKey }) => {
        const Icon = CATEGORY_ICONS[key];
        return (
          <div
            key={key}
            className="flex items-center justify-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-secondary p-3"
          >
            <div className="flex flex-1 flex-col items-start justify-start gap-1">
              <div className="flex items-center justify-start gap-2 self-stretch">
                <Icon className="size-5 text-button-secondary-outline-text" />
                <div className="flex-1 text-sm leading-5 font-normal text-text-primary">{t(titleKey)}</div>
              </div>
              <div className="text-sm leading-5 font-normal text-text-secondary">{t(descKey)}</div>
            </div>
            <Switch checked={draft[key]} onCheckedChange={(v) => setKey(key, v)} />
          </div>
        );
      })}
    </div>
  );

  const footer: ReactNode = (
    <div className="flex shrink-0 flex-col items-start justify-start gap-4 self-stretch border-t border-border-default px-6 py-4">
      <div className="flex items-center justify-start gap-4 self-stretch">
        <AppButton variant="primary" size="md" className="flex-1" onClick={acceptAll}>
          {t("cookie.acceptAll")}
        </AppButton>
        <AppButton variant="secondary-outline" size="md" className="flex-1" onClick={declineAll}>
          {t("cookie.declineAll")}
        </AppButton>
      </div>
      <AppButton
        variant="secondary-outline"
        size="md"
        className="w-full"
        onClick={() => updateConsent(draft)}
      >
        {t("cookie.savePreferences")}
      </AppButton>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={showDialog} onOpenChange={(next) => !next && closeDialog()}>
        <DrawerContent className="flex max-h-[85vh] flex-col gap-0 bg-bg-primary p-0">
          <div className="flex shrink-0 items-start justify-start gap-3 self-stretch border-b border-border-default px-4 pb-4">
            <div className="flex size-12 items-center justify-center gap-2 rounded-lg bg-bg-brand-subtle p-3">
              <CookieIcon className="size-6 text-icon-brand" />
            </div>
            <div className="flex flex-1 flex-col items-start justify-start gap-0.5">
              <DrawerTitle className="text-lg leading-7 font-medium text-text-primary">
                {adminTitle || t("cookie.title")}
              </DrawerTitle>
              <div className="text-sm leading-5 font-normal text-text-secondary">{t("cookie.subtitle")}</div>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              aria-label={t("cookie.close")}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary p-2"
            >
              <span className="text-lg leading-none text-button-secondary-outline-text">×</span>
            </button>
          </div>

          {body}
          {footer}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={showDialog} onOpenChange={(next) => !next && closeDialog()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col items-center gap-0 overflow-hidden rounded-xl bg-bg-primary p-0 outline outline-1 -outline-offset-1 outline-border-default sm:max-w-[582px]"
        >
          <div className="flex shrink-0 items-start justify-start gap-3 self-stretch px-6 py-4 outline outline-1 -outline-offset-1 outline-border-default">
            <div className="flex size-12 items-center justify-center gap-2 rounded-lg bg-bg-brand-subtle p-3">
              <CookieIcon className="size-6 text-icon-brand" />
            </div>
            <div className="flex flex-1 flex-col items-start justify-start gap-0.5">
              <div className="text-lg leading-7 font-medium text-text-primary">
                {adminTitle || t("cookie.title")}
              </div>
              <div className="text-sm leading-5 font-normal text-text-secondary">{t("cookie.subtitle")}</div>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              aria-label={t("cookie.close")}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary p-2"
            >
              <span className="text-lg leading-none text-button-secondary-outline-text">×</span>
            </button>
          </div>

          {body}
          {footer}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
