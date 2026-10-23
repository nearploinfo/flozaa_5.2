"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { MobileAddressFlow } from "@/components/account/mobile-address-flow";
import { RemoveAddressSheet } from "@/components/checkout/remove-address-sheet";
import { AddressCard, AddressCardMobile } from "@/components/account/address-card";
import { AddressCardSkeleton } from "@/components/account/address-card-skeleton";
import { AddressesEmptyState } from "@/components/account/addresses-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AppButton } from "@/components/ui/app-button";
import { deleteAddressApi, getAddressApi, type AddressApi } from "@/api/apiRoutes";
import { useIsMobile } from "@/lib/use-is-mobile";
import { useTranslation } from "@/lib/i18n/translation-context";
import ProfileLayout from "./ProfileLayout";

export function AddressesView() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const title = t("account.addresses.title");

  const [addresses, setAddresses] = useState<AddressApi[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressApi | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AddressApi | null>(null);

  const loadAddresses = () => {
    getAddressApi().then((response) => {
      setAddresses(response?.data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openAddDialog = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const openEditDialog = (addressItem: AddressApi) => {
    setEditingAddress(addressItem);
    setDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    setDeletingId(addressId);
    try {
      const response = await deleteAddressApi({ address_id: addressId });
      if (response?.error) throw new Error(response?.message);
      toast.success(t("account.addresses.form.deleteSuccess"));
      loadAddresses();
      setRemoveTarget(null);
    } catch {
      toast.error(t("account.addresses.form.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  // Desktop keeps the existing delete-icon-only flow (no confirm sheet);
  // mobile's list is denser/easier to mis-tap, so confirm before deleting.
  const requestDelete = (addressId: string) => {
    if (isMobile) {
      setRemoveTarget(addresses?.find((item) => item.id === addressId) ?? null);
      return;
    }
    handleDelete(addressId);
  };

  // Mobile skips the in-illustration CTA — the fixed bottom "Add New
  // Address" bar already covers it.
  const mobileEmptyState = (
    <AddressesEmptyState
      title={t("account.addresses.empty")}
      description={t("account.addresses.emptyDescription")}
    />
  );
  const desktopEmptyState = (
    <AddressesEmptyState
      title={t("account.addresses.empty")}
      description={t("account.addresses.emptyDescription")}
      ctaLabel={t("account.addresses.addNew")}
      onCtaClick={openAddDialog}
    />
  );

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />

      {/* Mobile */}
      <div className="xl:hidden">
        <ProfileLayout title={t("account.addresses.mobileTitle")}>
          <div className="grid w-full grid-cols-1 gap-4 pb-28 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex w-full flex-col items-start gap-4 rounded-3xl bg-bg-primary p-4">
                  <div className="flex w-full items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))
            ) : !addresses || addresses.length === 0 ? (
              mobileEmptyState
            ) : (
              addresses.map((addressItem) => (
                <AddressCardMobile
                  key={addressItem.id}
                  address={addressItem}
                  deleting={deletingId === addressItem.id}
                  onEdit={openEditDialog}
                  onDelete={requestDelete}
                />
              ))
            )}
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-border-default bg-bg-primary p-4">
            <AppButton variant="primary" size="md" className="w-full" onClick={openAddDialog}>
              {t("account.addresses.addNew")}
            </AppButton>
          </div>
        </ProfileLayout>
      </div>

      {/* Desktop */}
      <div className="container hidden flex-col items-start gap-6 py-16 xl:flex xl:flex-row xl:justify-center">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
            <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
            <AppButton variant="primary" size="md" leftIcon={Plus} onClick={openAddDialog}>
              {t("account.addresses.addNew")}
            </AppButton>
          </div>

          {!loading && (!addresses || addresses.length === 0) ? (
            desktopEmptyState
          ) : (
            <div className="grid w-full grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => <AddressCardSkeleton key={index} />)
                : addresses!.map((addressItem) => (
                    <AddressCard
                      key={addressItem.id}
                      address={addressItem}
                      deleting={deletingId === addressItem.id}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        <MobileAddressFlow
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          address={editingAddress}
          onSaved={loadAddresses}
        />
      ) : (
        <AddressFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          address={editingAddress}
          onSaved={loadAddresses}
        />
      )}

      <RemoveAddressSheet
        open={removeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setRemoveTarget(null);
        }}
        removing={removeTarget !== null && deletingId === removeTarget.id}
        onConfirm={() => removeTarget && handleDelete(removeTarget.id)}
      />
    </>
  );
}
