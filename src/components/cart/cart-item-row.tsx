"use client";

import { StarIcon, UsersIcon, ClockIcon, TrashIcon } from "@/components/icons/icons";
import { AppImage } from "@/components/ui/app-image";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useShowPrice } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CartItem } from "@/lib/cart-types";

const DURATION_TRANSLATION_KEY: Record<"minutes" | "hours" | "days", string> = {
  minutes: "common.minutesCount",
  hours: "common.hoursCount",
  days: "common.daysCount",
};

export function CartItemRow({
  item,
  disabled,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  disabled?: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const hasDiscount = Boolean(item.discountedPrice && item.discountedPrice < item.price);
  const displayPrice = hasDiscount ? (item.discountedPrice as number) : item.price;
  const priceText = useShowPrice(displayPrice);
  const originalPriceText = useShowPrice(item.price);

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-border-default bg-bg-primary p-4">
      <div className="flex w-full items-center gap-4">
        <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-bg-secondary">
          {item.image && (
            <AppImage
              src={item.image}
              alt={item.serviceTitle ?? ""}
              className="h-28 w-20 rounded-md object-cover"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col items-start justify-center gap-6">
          <div className="flex w-full items-start justify-end gap-6">
            <div className="flex flex-1 flex-col items-start gap-2">
              <span className="text-base font-medium text-text-primary">
                {item.serviceTitle ?? ""}
              </span>
              <div className="flex items-center gap-2">
                {item.averageRating ? (
                  <>
                    <span className="flex items-center gap-1 text-sm text-text-secondary">
                      <StarIcon className="size-4 text-icon-warning" />
                      {item.averageRating}
                    </span>
                    <span className="h-4 w-px bg-border-default" />
                  </>
                ) : null}
                {item.numberOfMembersRequired ? (
                  <>
                    <span className="flex items-center gap-1 text-sm text-text-secondary">
                      <UsersIcon className="size-4 text-icon-secondary" />
                      {t("common.personsCount", {
                        count: String(item.numberOfMembersRequired).padStart(2, "0"),
                      })}
                    </span>
                    <span className="h-4 w-px bg-border-default" />
                  </>
                ) : null}
                {item.duration ? (
                  <span className="flex items-center gap-1 text-sm text-text-secondary">
                    <ClockIcon className="size-4 text-icon-secondary" />
                    {t(
                      DURATION_TRANSLATION_KEY[
                        (item.durationType as "minutes" | "hours" | "days") ?? "minutes"
                      ],
                      { count: item.duration }
                    )}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-lg font-semibold text-text-primary">{priceText}</span>
                {hasDiscount ? (
                  <span className="text-sm text-text-secondary line-through">
                    {originalPriceText}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <QuantitySelector
              quantity={item.qty}
              onDecrease={() => onQuantityChange(Math.max(1, item.qty - 1))}
              onIncrease={() => onQuantityChange(item.qty + 1)}
              decreaseLabel={t("common.decreaseQuantityAriaLabel", { title: item.serviceTitle ?? "" })}
              increaseLabel={t("common.increaseQuantityAriaLabel", { title: item.serviceTitle ?? "" })}
              className="rounded-lg bg-bg-brand-subtle border-transparent p-1"
            />
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              aria-label={t("cartPage.removeServiceAriaLabel", { title: item.serviceTitle ?? "" })}
              className="rounded-sm p-1 text-button-link-primary-text transition-opacity hover:opacity-70 disabled:opacity-50"
            >
              <TrashIcon className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
