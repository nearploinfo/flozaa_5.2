"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { VerifiedBadgeIcon, ClearIcon } from "@/components/icons/icons";
import { ClearCartSheet } from "@/components/cart/clear-cart-sheet";
import { RemoveProviderSheet } from "@/components/cart/remove-provider-sheet";
import { useCart } from "@/lib/use-cart";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Mobile counterpart to /cart (a full page with per-item editing on
 * desktop) — a bottom sheet listing each provider's group so the user can
 * jump straight into checkout for one provider at a time, same booking
 * flow as desktop's provider-select-then-checkout. */
export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data } = useCart();
  const showPrice = usePriceFormatter();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ providerId: number; providerName: string } | null>(
    null
  );

  const groups = data?.carts ?? [];

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="items-center gap-6 bg-bg-primary">
          <div className="flex w-full flex-col items-start gap-2 px-4">
            <div className="flex w-full items-center gap-4">
              <DrawerTitle className="flex-1 text-base font-medium text-text-primary">
                {t("cartDropdown.titleWithProviders", { count: groups.length })}
              </DrawerTitle>
              {groups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="text-sm text-button-link-primary-text underline"
                >
                  {t("cartDropdown.clearAll")}
                </button>
              )}
            </div>
            <div className="dashed-divider" />
          </div>

          <div className="flex w-full flex-col items-start gap-4 px-4 pb-8">
            {groups.length === 0 && (
              <p className="w-full py-6 text-center text-sm text-text-secondary">
                {t("cartDropdown.empty")}
              </p>
            )}
            {groups.map((group, index) => (
              <div key={group.cartId} className="flex w-full flex-col items-start gap-4">
                <div className="flex w-full items-center gap-6">
                  {group.providerSlug ? (
                    <Link
                      href={`/provider-details/${group.providerSlug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex flex-1 items-start gap-2"
                    >
                      <AppImage
                        src={group.providerImage ?? ""}
                        alt={group.companyName}
                        className="size-9 shrink-0 rounded-full border-[1.69px] border-border-white object-cover shadow-[0px_4.5px_36px_0px_rgba(0,0,0,0.08)]"
                      />
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <div className="flex items-center gap-1">
                          <span className="line-clamp-1 text-xs font-medium text-text-primary">
                            {group.companyName}
                          </span>
                          {group.isProviderVerified && (
                            <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          <span>{t("common.servicesCount", { count: group.totalQuantity })}</span>
                          <span className="size-1 rounded-full bg-icon-secondary" />
                          <span>{showPrice(group.subTotal)}</span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex flex-1 items-start gap-2">
                      <AppImage
                        src={group.providerImage ?? ""}
                        alt={group.companyName}
                        className="size-9 shrink-0 rounded-full border-[1.69px] border-border-white object-cover shadow-[0px_4.5px_36px_0px_rgba(0,0,0,0.08)]"
                      />
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <div className="flex items-center gap-1">
                          <span className="line-clamp-1 text-xs font-medium text-text-primary">
                            {group.companyName}
                          </span>
                          {group.isProviderVerified && (
                            <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          <span>{t("common.servicesCount", { count: group.totalQuantity })}</span>
                          <span className="size-1 rounded-full bg-icon-secondary" />
                          <span>{showPrice(group.subTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/checkout?cartId=${group.cartId}`}
                      onClick={() => onOpenChange(false)}
                      className="rounded-xl bg-button-primary-bg px-3 py-2 text-sm font-normal text-button-primary-text"
                    >
                      {t("common.view")}
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setRemoveTarget({ providerId: group.providerId, providerName: group.companyName })
                      }
                      aria-label={t("cartDropdown.removeProvider")}
                      className="flex items-center justify-center rounded-full bg-bg-secondary p-2"
                    >
                      <ClearIcon className="size-5 text-icon-primary" />
                    </button>
                  </div>
                </div>

                {index < groups.length - 1 && <div className="dashed-divider" />}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <ClearCartSheet open={confirmClearOpen} onOpenChange={setConfirmClearOpen} />
      <RemoveProviderSheet
        open={removeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setRemoveTarget(null);
        }}
        providerId={removeTarget?.providerId ?? null}
        providerName={removeTarget?.providerName ?? ""}
      />
    </>
  );
}
