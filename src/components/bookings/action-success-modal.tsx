"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { CheckIcon, CloseIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

export function ActionSuccessModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-96 max-w-[calc(100%-2rem)] flex-col items-start gap-0 overflow-hidden rounded-2xl bg-bg-primary p-0 ring-1 ring-border-default sm:max-w-[calc(100%-2rem)]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex w-full items-center justify-end gap-6 border-b border-border-default px-6 py-4">
          <AppButton
            variant="secondary-outline"
            size="md"
            iconOnly
            leftIcon={CloseIcon}
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
          >
            {t("common.close")}
          </AppButton>
        </div>

        <div className="flex w-full flex-col items-center gap-6 p-4">
          <div className="flex w-full flex-col items-center gap-4">
            <span className="flex items-center justify-center rounded-xl bg-bg-success p-3">
              <CheckIcon className="size-7 text-icon-inverse" />
            </span>
            <div className="flex w-full flex-col items-center gap-1">
              <span className="w-full text-center text-lg font-medium text-text-primary">{title}</span>
              <span className="w-full text-center text-sm font-medium text-text-secondary">{description}</span>
            </div>
          </div>

          <div className="flex w-full items-start gap-4">
            <AppButton variant="primary" size="md" className="flex-1" onClick={onConfirm}>
              {confirmLabel}
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
