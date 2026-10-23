"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, TriangleAlert, Navigation } from "lucide-react";
import {
  DoorstepIcon,
  ProviderStoreIcon,
  LocationPinIcon,
  PhoneIcon,
  MapPinAreaIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from "@/components/icons/icons";
import { AllAddressesModal } from "@/components/checkout/all-addresses-modal";
import { ManageLocationSheet } from "@/components/checkout/manage-location-sheet";
import { RemoveAddressSheet } from "@/components/checkout/remove-address-sheet";
import { ProviderLocationSheet } from "@/components/checkout/provider-location-sheet";
import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { MobileAddressFlow } from "@/components/account/mobile-address-flow";
import { useIsMobile } from "@/lib/use-is-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { AppButton } from "@/components/ui/app-button";
import { normalizeAddressType, deleteAddressApi, type AddressApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { DeliveryAddressType } from "@/lib/checkout/checkout-types";
import { cn } from "@/lib/utils";

export function LocationSection({
  canUseDoorstep,
  canUseStore,
  deliveryAddressType,
  onDeliveryAddressTypeChange,
  addresses,
  addressesStatus,
  selectedAddressId,
  onSelectAddress,
  deliveryNote,
  onDeliveryNoteChange,
  onAddressesChanged,
  providerAvailabilityStatus,
  providerDistanceKm,
  providerLatitude,
  providerLongitude,
  providerAddress,
  areaRequestStatus,
  onRequestAreaCoverage,
  addressLocationError,
}: {
  canUseDoorstep: boolean;
  canUseStore: boolean;
  deliveryAddressType: DeliveryAddressType;
  onDeliveryAddressTypeChange: (mode: DeliveryAddressType) => void;
  addresses: AddressApi[];
  addressesStatus: "idle" | "loading" | "loaded" | "error";
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  deliveryNote: string;
  onDeliveryNoteChange: (note: string) => void;
  onAddressesChanged: () => void;
  providerAvailabilityStatus: "idle" | "checking" | "available" | "unavailable";
  providerDistanceKm: number | null;
  providerLatitude?: number;
  providerLongitude?: number;
  providerAddress?: string;
  areaRequestStatus: "idle" | "submitting" | "submitted";
  onRequestAreaCoverage: () => void;
  /** Set when the selected address can't be ordered to — it predates
   * country/region on addresses, which place_order now requires. */
  addressLocationError?: string | null;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [allAddressesOpen, setAllAddressesOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [manageSheetOpen, setManageSheetOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [removeAddressTarget, setRemoveAddressTarget] = useState<AddressApi | null>(null);
  const [editTarget, setEditTarget] = useState<AddressApi | null | undefined>(undefined);
  const [providerLocationOpen, setProviderLocationOpen] = useState(false);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;

  const handleRemoveAddress = async (address: AddressApi) => {
    setDeletingAddressId(address.id);
    try {
      const response = await deleteAddressApi({ address_id: address.id });
      if (response?.error) throw new Error(response?.message);
      toast.success(t("account.addresses.form.deleteSuccess"));
      onAddressesChanged();
      setRemoveAddressTarget(null);
    } catch {
      toast.error(t("account.addresses.form.deleteFailed"));
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleDeleteSelectedAddress = async () => {
    if (!selectedAddress) return;
    setDeletingAddressId(selectedAddress.id);
    try {
      const response = await deleteAddressApi({ address_id: selectedAddress.id });
      if (response?.error) throw new Error(response?.message);
      toast.success(t("account.addresses.form.deleteSuccess"));
      onAddressesChanged();
    } catch {
      toast.error(t("account.addresses.form.deleteFailed"));
    } finally {
      setDeletingAddressId(null);
    }
  };

  const modes = ([
    ["doorstep", canUseDoorstep],
    ["store", canUseStore],
  ] as const).filter(([, allowed]) => allowed);

  return (
    <div className="flex w-full flex-col items-start xl:rounded-2xl xl:border xl:border-border-default xl:bg-bg-primary">
      <div className="hidden w-full items-center gap-4 border-b border-border-default p-4 xl:flex">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-3xl border border-border-default bg-bg-secondary p-2">
          <LocationPinIcon className="size-6 text-icon-primary" />
        </span>
        <span className="flex-1 text-base font-medium text-text-primary">
          {t("checkoutPage.location.title")}
        </span>
      </div>

      <div className="hidden w-full flex-col items-start gap-6 p-4 xl:flex">
        <div className="flex w-full items-start gap-4">
          {modes.map(([value]) => {
            const Icon = value === "doorstep" ? DoorstepIcon : ProviderStoreIcon;
            const selected = deliveryAddressType === value;
            return (
              <AppButton
                key={value}
                variant="secondary-outline"
                role="radio"
                aria-checked={selected}
                onClick={() => onDeliveryAddressTypeChange(value)}
                className={cn(
                  "flex-1 items-start justify-start gap-3 border-border-default bg-bg-primary p-4 text-left text-text-primary transition-shadow duration-200",
                  selected && "border-border-brand shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)]"
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle p-2">
                  <Icon className="size-6 text-icon-brand" />
                </span>
                <span className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-base font-medium text-text-primary">
                    {value === "doorstep"
                      ? t("checkoutPage.location.doorstepTitle")
                      : t("checkoutPage.location.storeTitle")}
                  </span>
                  <span className="line-clamp-1 text-sm text-text-secondary">
                    {value === "doorstep"
                      ? t("checkoutPage.location.doorstepDescription")
                      : t("checkoutPage.location.storeDescription")}
                  </span>
                </span>
                <span className="flex items-center justify-center rounded-3xl border border-border-black p-1">
                  <span
                    className={cn(
                      "size-3.5 rounded-full bg-bg-brand transition-opacity",
                      selected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </span>
              </AppButton>
            );
          })}
        </div>

        {deliveryAddressType === "doorstep" && (
          <>
            <div className="dashed-divider" />

            <div className="flex w-full flex-col items-start gap-4">
              <div className="flex w-full items-center gap-3">
                <span className="flex-1 text-base text-text-primary">
                  {t("checkoutPage.location.serviceAddress")}
                </span>
                {addressesStatus === "loaded" && addresses.length > 0 && (
                  <AppButton
                    type="button"
                    variant="link"
                    onClick={() => setAllAddressesOpen(true)}
                  >
                    {t("checkoutPage.location.viewAllAddresses")}
                  </AppButton>
                )}
              </div>

              {addressesStatus === "loading" && (
                <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-border-default bg-bg-primary p-4">
                  <div className="flex w-full items-center gap-3">
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="dashed-divider" />
                  <div className="flex w-full flex-col items-start gap-3">
                    <Skeleton className="h-4 w-full max-w-96" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              )}

              {addressesStatus === "loaded" && addresses.length === 0 && (
                <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-border-default bg-bg-primary p-4">
                  <span className="text-sm text-text-secondary">{t("checkoutPage.location.noAddresses")}</span>
                  <AppButton
                    type="button"
                    variant="primary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setEditTarget(null)}
                  >
                    {t("checkoutPage.location.addAddress")}
                  </AppButton>
                </div>
              )}

              {addressesStatus === "loaded" && selectedAddress && (
                <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-border-default bg-bg-primary p-4">
                  <div className="flex w-full items-center gap-3">
                    <span className="flex items-center justify-center rounded-3xl border border-border-black p-1">
                      <span className="size-3.5 rounded-full bg-bg-brand" />
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-base font-medium capitalize text-text-primary">
                        {normalizeAddressType(selectedAddress.type)}
                      </span>
                      {selectedAddress.is_default === "1" && (
                        <span className="rounded-[20px] border border-border-brand/20 bg-bg-brand-subtle px-2 py-0.5 text-sm text-text-brand">
                          {t("checkoutPage.location.default")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={t("checkoutPage.location.editAddressAriaLabel")}
                        onClick={() => setEditTarget(selectedAddress)}
                        className="rounded-sm p-1 text-icon-primary hover:opacity-70"
                      >
                        <Pencil className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("checkoutPage.location.deleteAddressAriaLabel")}
                        disabled={deletingAddressId === selectedAddress.id}
                        onClick={handleDeleteSelectedAddress}
                        className="rounded-sm p-1 text-icon-primary hover:opacity-70 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>

                  <div className="dashed-divider" />

                  <div className="flex w-full flex-col items-start gap-3">
                    <span className="line-clamp-2 text-sm text-text-primary">
                      {[
                        selectedAddress.address,
                        [selectedAddress.region, selectedAddress.country].filter(Boolean).join(", "),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-text-primary">
                      <PhoneIcon className="size-5 text-icon-primary" />
                      {selectedAddress.mobile}
                    </span>
                  </div>
                </div>
              )}

              {selectedAddress && providerAvailabilityStatus === "unavailable" && (
                <div className="flex w-full items-center gap-3 rounded-lg bg-alert-warning-bg p-3">
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="size-5 text-icon-warning" />
                      <span className="text-sm font-medium text-text-primary">
                        {t("checkoutPage.location.serviceUnavailableTitle")}
                      </span>
                    </div>
                    <span className="text-sm text-text-secondary">
                      {t("checkoutPage.location.serviceUnavailableDescription")}
                    </span>
                  </div>
                  <AppButton
                    type="button"
                    variant="primary"
                    size="md"
                    leftIcon={MapPinAreaIcon}
                    disabled={areaRequestStatus !== "idle"}
                    className="shrink-0 bg-bg-warning hover:opacity-90"
                    onClick={onRequestAreaCoverage}
                  >
                    {areaRequestStatus === "submitted"
                      ? t("checkoutPage.location.areaRequestSubmitted")
                      : areaRequestStatus === "submitting"
                        ? t("checkoutPage.location.areaRequestSubmitting")
                        : t("checkoutPage.location.requestServiceHere")}
                  </AppButton>
                </div>
              )}
            </div>
          </>
        )}

        {deliveryAddressType !== "doorstep" && providerDistanceKm != null && (
          <div className="flex w-full items-center gap-3 rounded-lg bg-alert-warning-bg p-3">
            <span className="flex-1 text-sm font-medium text-text-primary">
              {t("checkoutPage.location.distanceFromYou", { distance: providerDistanceKm.toFixed(1) })}
            </span>
            <AppButton
              type="button"
              variant="primary"
              size="md"
              leftIcon={Navigation}
              className="shrink-0 bg-bg-warning hover:opacity-90"
              onClick={() => {
                if (providerLatitude == null || providerLongitude == null) return;
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${providerLatitude},${providerLongitude}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              {t("checkoutPage.location.getDirection")}
            </AppButton>
          </div>
        )}
      </div>

      {/* Mobile: flat, borderless summary row (no card, no icon/title header)
          instead of the desktop radio cards — tapping the address opens the
          manage-location sheet (doorstep) or provider-location sheet
          (store), tapping the mode pill opens a small dropdown. */}
      <div className="flex w-full flex-col items-start gap-2 bg-bg-primary p-4 xl:hidden">
        <div className="flex w-full items-center gap-6">
          <button
            type="button"
            onClick={() =>
              deliveryAddressType === "doorstep"
                ? setManageSheetOpen(true)
                : setProviderLocationOpen(true)
            }
            className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
          >
            <span className="text-xs text-text-secondary">
              {deliveryAddressType === "doorstep"
                ? t("checkoutPage.location.serviceLocationLabel")
                : t("checkoutPage.location.providerLocationTitle")}
            </span>
            <span className="flex max-w-full min-w-0 items-center gap-1">
              <span className="line-clamp-1 min-w-0 text-xs font-medium text-text-primary">
                {deliveryAddressType === "doorstep"
                  ? (selectedAddress?.address ?? t("checkoutPage.location.noAddresses"))
                  : (providerAddress ?? t("checkoutPage.location.viewProviderLocation"))}
              </span>
              <ChevronDownIcon className="size-4 shrink-0 text-icon-primary" />
            </span>
          </button>

          {modes.length > 1 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setModeDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-lg border border-border-default bg-bg-secondary p-2"
              >
                <span className="text-xs font-medium text-text-primary">
                  {deliveryAddressType === "doorstep"
                    ? t("checkoutPage.location.doorstepTitle")
                    : t("checkoutPage.location.storeTitle")}
                </span>
                <ChevronDownIcon className="size-4 text-icon-primary" />
              </button>

              {modeDropdownOpen && (
                <>
                  <button
                    type="button"
                    aria-label={t("checkoutPage.location.closeAriaLabel")}
                    onClick={() => setModeDropdownOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 flex w-40 flex-col gap-3 rounded-lg bg-bg-primary p-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.16)]">
                    {modes.map(([value], index) => {
                      const Icon = value === "doorstep" ? DoorstepIcon : ProviderStoreIcon;
                      const selected = deliveryAddressType === value;
                      return (
                        <div key={value} className="flex flex-col gap-3">
                          {index > 0 && <div className="dashed-divider" />}
                          <button
                            type="button"
                            onClick={() => {
                              onDeliveryAddressTypeChange(value);
                              setModeDropdownOpen(false);
                            }}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="flex items-center gap-1">
                              <Icon
                                className={cn(
                                  "size-5",
                                  selected ? "text-icon-primary" : "text-icon-secondary"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-sm",
                                  selected ? "text-text-primary" : "text-text-secondary"
                                )}
                              >
                                {value === "doorstep"
                                  ? t("checkoutPage.location.doorstepTitle")
                                  : t("checkoutPage.location.storeTitle")}
                              </span>
                            </span>
                            <CheckCircleIcon
                              className={cn(
                                "size-5 shrink-0 text-icon-brand",
                                selected ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {addressLocationError && (
        <div className="flex w-full items-start gap-2 bg-alert-warning-bg p-4">
          <TriangleAlert className="size-5 shrink-0 text-icon-warning" />
          <span className="text-sm text-text-warning">{addressLocationError}</span>
        </div>
      )}

      {deliveryAddressType === "doorstep" &&
        selectedAddress &&
        providerAvailabilityStatus === "unavailable" &&
        areaRequestStatus !== "submitted" && (
          <div className="flex w-full flex-col items-start gap-3 bg-alert-warning-bg p-4 xl:hidden">
            <div className="flex w-full flex-col items-start gap-1">
              <span className="text-sm font-semibold text-text-warning">
                {t("checkoutPage.location.serviceUnavailableTitle")}
              </span>
              <span className="text-xs text-text-secondary">
                {t("checkoutPage.location.serviceUnavailableDescription")}
              </span>
            </div>
            <AppButton
              type="button"
              variant="primary"
              size="md"
              className="w-full justify-center bg-bg-warning hover:opacity-90"
              disabled={areaRequestStatus !== "idle"}
              onClick={onRequestAreaCoverage}
            >
              {areaRequestStatus === "submitting"
                ? t("checkoutPage.location.areaRequestSubmitting")
                : t("checkoutPage.location.requestServiceHere")}
            </AppButton>
          </div>
        )}

      {deliveryAddressType === "doorstep" && areaRequestStatus === "submitted" && (
        <div className="flex w-full flex-col items-start gap-1 bg-alert-success-bg p-4 xl:hidden">
          <div className="flex w-full items-center gap-1">
            <CheckCircleIcon className="size-5 shrink-0 text-icon-success" />
            <span className="text-sm font-semibold text-text-primary">
              {t("checkoutPage.location.areaRequestSuccessTitle")}
            </span>
          </div>
          <span className="text-xs text-text-secondary">
            {t("checkoutPage.location.areaRequestSuccessDescription")}
          </span>
        </div>
      )}

      {deliveryAddressType !== "doorstep" && providerDistanceKm != null && (
        <div className="flex w-full items-center gap-2 bg-alert-warning-bg p-4 xl:hidden">
          <span className="flex-1 text-xs text-text-primary">
            {t("checkoutPage.location.distanceFromYou", { distance: providerDistanceKm.toFixed(1) })}
          </span>
          <button
            type="button"
            onClick={() => {
              if (providerLatitude == null || providerLongitude == null) return;
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${providerLatitude},${providerLongitude}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="shrink-0 text-base font-medium text-text-primary underline"
          >
            {t("checkoutPage.location.getDirection")}
          </button>
        </div>
      )}

      {/* Desktop only — mobile edits the same deliveryNote via the "Write
          Instruction" sheet in MobileItemsSection instead. */}
      <div className="hidden w-full flex-col items-start gap-4 bg-bg-primary p-4 pt-0 xl:flex">
        <div className="dashed-divider" />
        <div className="flex h-40 w-full flex-col items-start gap-2">
          <label className="text-base text-form-field-label">
            {t("checkoutPage.location.addInstructionsLabel")}
          </label>
          <textarea
            value={deliveryNote}
            onChange={(event) => onDeliveryNoteChange(event.target.value)}
            placeholder={t("checkoutPage.location.addInstructionsPlaceholder")}
            className="h-full w-full flex-1 resize-none rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-text-primary outline-none placeholder:text-form-field-placeholder focus-visible:border-border-brand"
          />
        </div>
      </div>

      <ManageLocationSheet
        open={manageSheetOpen}
        onOpenChange={setManageSheetOpen}
        addresses={addresses}
        onSelectAddress={(id) => {
          onSelectAddress(id);
          setManageSheetOpen(false);
        }}
        onEditAddress={(address) => {
          setManageSheetOpen(false);
          setEditTarget(address);
        }}
        onAddAddress={() => {
          setManageSheetOpen(false);
          setEditTarget(null);
        }}
        onRemoveAddress={(address) => setRemoveAddressTarget(address)}
      />

      <RemoveAddressSheet
        open={removeAddressTarget !== null}
        onOpenChange={(next) => {
          if (!next) setRemoveAddressTarget(null);
        }}
        removing={removeAddressTarget !== null && deletingAddressId === removeAddressTarget.id}
        onConfirm={() => removeAddressTarget && handleRemoveAddress(removeAddressTarget)}
      />

      <ProviderLocationSheet
        open={providerLocationOpen}
        onOpenChange={setProviderLocationOpen}
        providerLatitude={providerLatitude}
        providerLongitude={providerLongitude}
        providerAddress={providerAddress}
      />

      <AllAddressesModal
        open={allAddressesOpen}
        onOpenChange={setAllAddressesOpen}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onConfirm={onSelectAddress}
      />

      {isMobile ? (
        <MobileAddressFlow
          open={editTarget !== undefined}
          onOpenChange={(next) => {
            if (!next) setEditTarget(undefined);
          }}
          address={editTarget}
          onSaved={onAddressesChanged}
        />
      ) : (
        <AddressFormDialog
          open={editTarget !== undefined}
          onOpenChange={(next) => {
            if (!next) setEditTarget(undefined);
          }}
          address={editTarget}
          onSaved={onAddressesChanged}
        />
      )}
    </div>
  );
}
