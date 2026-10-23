"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { CloseIcon, PhoneIcon } from "@/components/icons/icons";
import { normalizeAddressType, type AddressApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

export function AllAddressesModal({
  open,
  onOpenChange,
  addresses,
  selectedAddressId,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: AddressApi[];
  selectedAddressId: string | null;
  onConfirm: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [draftId, setDraftId] = useState(selectedAddressId);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the draft to the current selection each time the modal opens —
  // done during render (not an effect) to avoid an extra render/flash.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraftId(selectedAddressId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[720px] gap-0 overflow-hidden p-0 sm:max-w-[720px]"
        showCloseButton={false}
      >
        <div className="flex w-full items-center gap-6 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-xl font-medium text-text-primary">
            {t("checkoutPage.location.allAddressesModalTitle")}
          </DialogTitle>
          <AppButton
            variant="secondary-outline"
            size="sm"
            iconOnly
            leftIcon={CloseIcon}
            aria-label={t("checkoutPage.location.closeAriaLabel")}
            onClick={() => onOpenChange(false)}
          >
            {t("checkoutPage.location.closeAriaLabel")}
          </AppButton>
        </div>

        <div className="flex max-h-[60vh] w-full flex-col items-start gap-6 overflow-y-auto p-6">
          {addresses.map((address) => {
            const selected = address.id === draftId;
            const isDefault = address.is_default === "1";
            const typeLabel = normalizeAddressType(address.type);
            return (
              <AppButton
                key={address.id}
                variant="secondary-outline"
                role="radio"
                aria-checked={selected}
                onClick={() => setDraftId(address.id)}
                className={cn(
                  "w-full flex-col items-start justify-start gap-4 border-border-default bg-bg-primary p-4 text-left",
                  selected && "border-border-brand"
                )}
              >
                <div className="flex w-full items-center gap-3">
                  <span className="flex items-center justify-center rounded-3xl border border-border-black p-1">
                    <span
                      className={cn(
                        "size-3.5 rounded-full bg-bg-brand transition-opacity",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-base font-medium capitalize text-text-primary">{typeLabel}</span>
                    {isDefault && (
                      <span className="rounded-[20px] border border-border-brand/20 bg-bg-brand-subtle px-2 py-0.5 text-sm text-text-brand">
                        {t("checkoutPage.location.default")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="dashed-divider" />

                <div className="flex w-full flex-col items-start gap-3">
                  <span className="line-clamp-2 text-sm text-text-primary">{address.address}</span>
                  <span className="flex items-center gap-2 text-sm text-text-primary">
                    <PhoneIcon className="size-5 text-icon-primary" />
                    {address.mobile}
                  </span>
                </div>
              </AppButton>
            );
          })}
        </div>

        <div className="flex w-full items-center gap-6 border-t border-border-default px-6 py-4">
          <AppButton
            className="flex-1"
            disabled={!draftId}
            onClick={() => {
              if (!draftId) return;
              onConfirm(draftId);
              onOpenChange(false);
            }}
          >
            {t("checkoutPage.location.updateAddress")}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
