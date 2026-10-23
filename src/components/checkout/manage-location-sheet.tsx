"use client";

import { Pencil, Trash2, Phone } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { AddressHomeIcon, AddressOfficeIcon, AddressOtherIcon } from "@/components/icons/icons";
import { normalizeAddressType, type AddressApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";

const TYPE_ICONS = {
  home: AddressHomeIcon,
  office: AddressOfficeIcon,
  other: AddressOtherIcon,
} as const;

/** Mobile-only address book sheet for checkout's doorstep flow — lists every
 * saved address with edit/delete, tapping a card selects it as the active
 * delivery address (buttons stop propagation so they don't also select). */
export function ManageLocationSheet({
  open,
  onOpenChange,
  addresses,
  onSelectAddress,
  onEditAddress,
  onAddAddress,
  onRemoveAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: AddressApi[];
  onSelectAddress: (id: string) => void;
  onEditAddress: (address: AddressApi) => void;
  onAddAddress: () => void;
  onRemoveAddress: (address: AddressApi) => void;
}) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-bg-primary">
        <div className="flex w-full flex-col items-center gap-2 px-4">
          <DrawerTitle className="w-full text-base font-medium text-text-primary">
            {t("checkoutPage.location.manageLocationTitle")}
          </DrawerTitle>
          <div className="dashed-divider" />
        </div>

        <div className="flex w-full flex-col items-start gap-3 overflow-y-auto p-4">
          {addresses.length === 0 && (
            <p className="w-full py-6 text-center text-sm text-text-secondary">
              {t("checkoutPage.location.noAddresses")}
            </p>
          )}
          {addresses.map((address) => {
            const type = normalizeAddressType(address.type);
            const Icon = TYPE_ICONS[type];
            const isDefault = address.is_default === "1";
            const locationText = [address.region, address.country].filter(Boolean).join(", ");
            const line = [address.address, locationText].filter(Boolean).join(", ");
            return (
              <button
                key={address.id}
                type="button"
                onClick={() => onSelectAddress(address.id)}
                className="flex w-full flex-col items-end gap-3 rounded-xl border border-border-default bg-bg-primary p-3 text-left"
              >
                <div className="flex w-full items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                    <Icon className="size-6 text-icon-primary" />
                  </span>
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-sm font-semibold capitalize text-text-primary">{type}</span>
                    {isDefault && (
                      <span className="text-xs text-text-brand">{t("checkoutPage.location.default")}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t("checkoutPage.location.editAddressAriaLabel")}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditAddress(address);
                      }}
                      className="flex size-9 items-center justify-center rounded-full bg-bg-secondary"
                    >
                      <Pencil className="size-5 text-icon-primary" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t("checkoutPage.location.deleteAddressAriaLabel")}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveAddress(address);
                      }}
                      className="flex size-9 items-center justify-center rounded-full bg-bg-secondary"
                    >
                      <Trash2 className="size-5 text-icon-primary" />
                    </span>
                  </div>
                </div>

                <div className="dashed-divider" />

                <div className="flex w-full flex-col items-start gap-1">
                  {line && <span className="text-xs text-text-secondary">{line}</span>}
                </div>

                <div className="flex w-full items-center gap-2 rounded-sm bg-bg-secondary p-2">
                  <Phone className="size-5 text-icon-primary" />
                  <span className="text-sm text-text-primary">{address.mobile}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex w-full items-center gap-4 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
          <AppButton variant="primary" size="lg" className="flex-1 justify-center" onClick={onAddAddress}>
            {t("checkoutPage.location.addAddress")}
          </AppButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
