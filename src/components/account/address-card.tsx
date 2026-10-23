"use client";

import { Pencil, Phone, Trash2 } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { LocationMap } from "@/components/maps/location-map";
import {
  normalizeAddressType,
  type AddressApi,
  type AddressType,
} from "@/api/apiRoutes";
import { AddressHomeIcon, AddressOfficeIcon, AddressOtherIcon, LocationPinIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

const TYPE_ICON: Record<AddressType, typeof AddressHomeIcon> = {
  home: AddressHomeIcon,
  office: AddressOfficeIcon,
  other: AddressOtherIcon,
};

export function AddressCardMobile({
  address,
  deleting,
  onEdit,
  onDelete,
}: {
  address: AddressApi;
  deleting: boolean;
  onEdit: (address: AddressApi) => void;
  onDelete: (addressId: string) => void;
}) {
  const { t } = useTranslation();

  const typeLabel: Record<AddressType, string> = {
    home: t("account.addresses.typeHome"),
    office: t("account.addresses.typeOffice"),
    other: t("account.addresses.typeOther"),
  };

  const normalizedType = normalizeAddressType(address.type);
  const TypeIcon = TYPE_ICON[normalizedType];
  const isDefault = address.is_default === "1";

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-3xl bg-bg-primary p-4">
      <div className="flex w-full items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary">
          <TypeIcon className="size-5 text-icon-primary" />
        </span>
        <div className="flex flex-1 flex-col items-start gap-0.5">
          <span className="text-sm font-semibold text-text-primary">{typeLabel[normalizedType]}</span>
          {isDefault && (
            <span className="text-sm font-medium text-button-link-primary-focus">
              {t("account.addresses.default")}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(address)}
            aria-label={t("account.addresses.edit")}
            className="flex size-9 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={deleting}
            aria-label={t("account.addresses.delete")}
            className="flex size-9 items-center justify-center rounded-full bg-bg-secondary text-icon-secondary disabled:opacity-60"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="dashed-divider" />

      <div className="flex w-full flex-col items-start gap-3">
        {(() => {
          const locationText = [address.region, address.country].filter(Boolean).join(", ");
          const line = [address.address, locationText].filter(Boolean).join(", ");
          return line && <span className="text-sm text-text-secondary">{line}</span>;
        })()}
        {address.mobile && (
          <span className="flex w-full items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2.5 text-sm font-medium text-text-primary">
            <Phone className="size-4 shrink-0 text-icon-secondary" />
            {address.mobile}
          </span>
        )}
      </div>
    </div>
  );
}

export function AddressCard({
  address,
  deleting,
  onEdit,
  onDelete,
}: {
  address: AddressApi;
  deleting: boolean;
  onEdit: (address: AddressApi) => void;
  onDelete: (addressId: string) => void;
}) {
  const { t } = useTranslation();

  const typeLabel: Record<AddressType, string> = {
    home: t("account.addresses.typeHome"),
    office: t("account.addresses.typeOffice"),
    other: t("account.addresses.typeOther"),
  };

  const normalizedType = normalizeAddressType(address.type);
  const TypeIcon = TYPE_ICON[normalizedType];
  const isDefault = address.is_default === "1";
  const lat = Number.parseFloat(address.lattitude);
  const lng = Number.parseFloat(address.longitude);
  const hasPosition = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-border-default bg-bg-primary p-4">
      {hasPosition && <LocationMap center={{ lat, lng }} zoom={14} className="h-52 w-full rounded-lg" />}
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-secondary p-3">
            <TypeIcon className="size-5 text-icon-primary" />
          </span>
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="text-sm font-medium text-text-primary">{typeLabel[normalizedType]}</span>
            {isDefault && (
              <span className="text-sm text-text-secondary">{t("account.addresses.default")}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AppButton
              variant="secondary"
              size="sm"
              leftIcon={Pencil}
              onClick={() => onEdit(address)}
              className="rounded-sm"
            >
              {t("account.addresses.edit")}
            </AppButton>
            <AppButton
              variant="link"
              size="sm"
              iconOnly
              leftIcon={Trash2}
              aria-label={t("account.addresses.delete")}
              disabled={deleting}
              onClick={() => onDelete(address.id)}
            >
              {t("account.addresses.delete")}
            </AppButton>
          </div>
        </div>

        <div className="dashed-divider" />

        <div className="flex w-full flex-col items-start gap-3">
          {(() => {
            const locationText = [address.region, address.country].filter(Boolean).join(", ");
            const line = [address.address, locationText].filter(Boolean).join(", ");
            return (
              line && (
                <div className="flex w-full items-center gap-2">
                  <LocationPinIcon className="size-5 shrink-0 text-icon-primary" />
                  <span className="line-clamp-2 flex-1 text-sm text-text-primary">{line}</span>
                </div>
              )
            );
          })()}
          {address.mobile && (
            <div className="flex w-full items-center gap-2">
              <Phone className="size-5 shrink-0 text-icon-primary" />
              <span className="line-clamp-2 flex-1 text-sm text-text-primary">{address.mobile}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
