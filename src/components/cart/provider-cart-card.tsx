"use client";

import { Link } from "@/components/ui/locale-link";
import { AppButton } from "@/components/ui/app-button";
import { VerifiedBadgeIcon, ClearIcon, CheckIcon, PlusIcon } from "@/components/icons/icons";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";
import { CartItemRow } from "@/components/cart/cart-item-row";
import type { CartGroup } from "@/lib/cart-types";

export function ProviderCartCard({
  group,
  selected,
  pending,
  onSelect,
  onQuantityChange,
  onRemoveService,
  onClear,
}: {
  group: CartGroup;
  /** Only one provider cart can be checked out at a time — radio, not a checkbox. */
  selected: boolean;
  pending?: boolean;
  onSelect: () => void;
  onQuantityChange: (serviceId: number, quantity: number) => void;
  onRemoveService: (serviceId: number) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();

  return (
    <div
      className={cn(
        "flex w-full flex-col items-start overflow-hidden rounded-2xl border bg-bg-primary transition-shadow duration-300",
        selected
          ? "border-border-black shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]"
          : "border-border-default"
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-3 p-4 transition-colors duration-300",
          selected ? "bg-bg-inverse" : "bg-bg-secondary"
        )}
      >
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={t("cartPage.selectProviderAriaLabel", { provider: group.companyName })}
          onClick={onSelect}
          className={cn(
            "flex items-center justify-center rounded-3xl border p-1 transition-colors duration-300",
            selected ? "border-border-white" : "border-border-black"
          )}
        >
          <span
            className={cn(
              "size-3.5 rounded-full transition-colors duration-300",
              selected ? "bg-bg-primary" : "bg-bg-brand opacity-0"
            )}
          />
        </button>

        <div className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "text-base font-medium transition-colors duration-300",
              selected ? "text-text-inverse-dark" : "text-text-primary"
            )}
          >
            {group.companyName}
          </span>
          {group.isProviderVerified && (
            <VerifiedBadgeIcon
              className={cn(
                "size-5 transition-colors duration-300",
                selected ? "text-icon-inverse" : "text-icon-brand"
              )}
            />
          )}
        </div>

        <AppButton
          variant="secondary-outline"
          size="md"
          asChild
          className={cn(
            "transition-colors duration-300",
            selected && "border-border-white text-text-inverse-dark hover:bg-white/10"
          )}
        >
          <Link href={`/provider-details/${group.providerSlug}#services`} className="flex items-center gap-2">
            <PlusIcon className="size-5 shrink-0" />
            {t("cartPage.addMoreServices")}
          </Link>
        </AppButton>

        {selected && (
          <div className="flex items-center gap-2 rounded-full bg-bg-primary px-4 py-2">
            <CheckIcon className="size-4 text-icon-primary" />
            <span className="text-base text-text-primary">{t("cartPage.selected")}</span>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col items-start gap-4 p-4">
        {group.items.map((service) => (
          <CartItemRow
            key={service.serviceId}
            item={service}
            disabled={pending}
            onQuantityChange={(quantity) => onQuantityChange(service.serviceId, quantity)}
            onRemove={() => onRemoveService(service.serviceId)}
          />
        ))}
      </div>

      <div className="flex w-full items-center justify-end gap-3 bg-bg-secondary p-4">
        <div className="flex flex-1 flex-col items-start gap-1">
          <div className="flex items-start gap-1">
            <span className="text-base text-text-primary">{t("cartPage.total")}</span>
            <span className="text-base text-text-primary">
              {t("cartPage.servicesCount", { count: group.items.length })}
            </span>
          </div>
          <span className="text-xl font-semibold text-text-primary">
            {showPrice(group.subTotal)}
          </span>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-base text-button-link-primary-text transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          <ClearIcon className="size-6" />
          {t("cartPage.clearThisProvider")}
        </button>
      </div>
    </div>
  );
}
