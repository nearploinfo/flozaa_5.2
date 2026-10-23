"use client";

import { Link } from "@/components/ui/locale-link";
import { cn } from "@/lib/utils";
import { useShowPrice } from "@/lib/show-price";
import { formatRating } from "@/lib/helpers";
import type { ServiceCardData } from "@/lib/services-catalog";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import {
  BookmarkIcon,
  CartIcon,
  ClockIcon,
  OfferTagIcon,
  StarIcon,
  UsersIcon,
  VerifiedBadgeIcon,
} from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useBookmarkToggle } from "@/lib/use-bookmark-toggle";
import { useCartQuantity } from "@/lib/use-cart-quantity";
import { flyToCart } from "@/lib/fly-to-cart";

const DURATION_TRANSLATION_KEY: Record<"minutes" | "hours" | "days", string> = {
  minutes: "common.minutesCount",
  hours: "common.hoursCount",
  days: "common.daysCount",
};

export function ServiceCard({
  service,
  active,
  initialBookmarked,
  onBookmarkChange,
}: {
  service: ServiceCardData;
  /** Forces the card's own hover appearance (border + shadow) permanently on — used to reflect a selected map pin. */
  active?: boolean;
  initialBookmarked?: boolean;
  onBookmarkChange?: (bookmarked: boolean) => void;
}) {
  const { t } = useTranslation();
  const priceText = useShowPrice(service.price);
  const originalPriceText = useShowPrice(service.originalPrice);
  const { bookmarked, toggle: toggleBookmark } = useBookmarkToggle({
    type: "service",
    id: service.serviceId ?? service.id,
    initialBookmarked: initialBookmarked ?? service.isBookmarked ?? false,
    onToggled: onBookmarkChange,
  });
  const { quantity, addToCart, increase, decrease } = useCartQuantity({
    serviceId: service.serviceId,
  });

  const handleBookmarkClick = (event: React.MouseEvent) => {
    event.preventDefault();
    toggleBookmark();
  };

  return (
    <>
      {/* Mobile — single Figma layout, no hover states, compact quantity/ADD control */}
      <Link
        href={`/service-details/${service.id}`}
        className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3 xl:hidden"
      >
        <div className="flex w-full items-start gap-2">
          <div className="relative h-18 w-14 shrink-0 overflow-hidden rounded-sm">
            <AppImage src={service.image} alt={service.title} fill className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col items-start gap-3">
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex w-full items-center">
                <span className="line-clamp-1 flex-1 text-sm font-semibold text-text-primary">
                  {service.title}
                </span>
                <AppButton
                  variant="link"
                  size="sm"
                  iconOnly
                  leftIcon={(iconProps) => (
                    <BookmarkIcon
                      {...iconProps}
                      filled={bookmarked}
                      className={bookmarked ? "size-5 text-bg-brand" : "size-5 text-icon-primary"}
                    />
                  )}
                  aria-pressed={bookmarked}
                  onClick={handleBookmarkClick}
                  className="shrink-0 p-0"
                >
                  {bookmarked ? t("common.removeBookmark") : t("common.addBookmark")}
                </AppButton>
              </div>
              <div className="flex w-full items-center gap-1 max-[380px]:flex-wrap">
                {service.rating > 0 && (
                  <>
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                      <StarIcon className="size-3.5 text-icon-warning" />
                      {formatRating(service.rating)}
                    </span>
                    <span className="size-1 rounded-full bg-bg-tertiary" />
                  </>
                )}
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <UsersIcon className="size-4 text-icon-secondary" />
                  {t("common.personsCount", { count: String(service.persons).padStart(2, "0") })}
                </span>
                <span className="size-1 rounded-full bg-bg-tertiary" />
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <ClockIcon className="size-4 text-icon-secondary" />
                  {t(DURATION_TRANSLATION_KEY[service.durationType ?? "minutes"] ?? DURATION_TRANSLATION_KEY.minutes, {
                    count: service.minutes,
                  })}
                </span>
              </div>
            </div>
            {service.providerName && (
              <span className="flex items-center gap-1 text-xs">
                <span className="text-text-secondary">By</span>
                <span className="flex items-center gap-1 text-text-primary underline">
                  {service.providerName}
                  {service.providerVerified && (
                    <VerifiedBadgeIcon className="size-3.5 shrink-0 text-icon-brand" />
                  )}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="dashed-divider" />

        <div className="flex w-full items-center gap-6">
          <div className="flex min-h-9 flex-1 flex-col items-start justify-center gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-text-primary">
                {priceText}
              </span>
              {service.discountPercent > 0 && (
                <span className="text-xs text-text-tertiary line-through">
                  {originalPriceText}
                </span>
              )}
            </div>
            <span
              className={cn(
                "flex items-center gap-1 text-xs text-text-success",
                service.discountPercent <= 0 && "invisible"
              )}
            >
              <OfferTagIcon className="size-3.5" />
              {t("common.discountOff", { percent: service.discountPercent })}
            </span>
          </div>
          {quantity === 0 ? (
            <AppButton
              variant="primary-outline"
              size="sm"
              aria-label={t("common.addToCartAriaLabel", { title: service.title })}
              onClick={(event) => {
                event.preventDefault();
                addToCart();
              }}
              className="shrink-0 rounded-lg bg-bg-brand-subtle px-3 py-1"
            >
              {t("common.add")}
            </AppButton>
          ) : (
            <QuantitySelector
              quantity={quantity}
              onDecrease={decrease}
              onIncrease={increase}
              decreaseLabel={t("common.decreaseQuantityAriaLabel", { title: service.title })}
              increaseLabel={t("common.increaseQuantityAriaLabel", { title: service.title })}
              className="rounded-lg border border-border-brand"
            />
          )}
        </div>
      </Link>

      <Link
        href={`/service-details/${service.id}`}
        className={cn(
          "group hidden flex-col gap-4 rounded-xl border bg-bg-primary p-4 transition-shadow duration-300 sm:flex-row xl:flex",
          quantity > 0 || active
            ? "border-bg-brand shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]"
            : "border-border-default hover:shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]"
        )}
      >
        <div className="relative w-full shrink-0 overflow-hidden rounded-lg sm:w-48">
          <AppImage
            src={service.image}
            alt={service.title}
            className="h-48 w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-120 sm:h-64 sm:w-48"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-start justify-between">
              {service.rating > 0 ? (
                <AppTag
                  variant="warning"
                  shape="chip"
                  leftIcon={StarIcon}
                  iconClassName="text-bg-warning"
                >
                  {formatRating(service.rating)}
                </AppTag>
              ) : (
                <span />
              )}
              <AppButton
                variant="secondary-outline"
                size="sm"
                iconOnly
                leftIcon={(iconProps) => (
                  <BookmarkIcon
                    {...iconProps}
                    filled={bookmarked}
                    className={
                      bookmarked
                        ? "size-5 text-bg-brand"
                        : "size-5 text-button-secondary-outline-text"
                    }
                  />
                )}
                aria-pressed={bookmarked}
                onClick={handleBookmarkClick}
                className="rounded-sm"
              >
                {bookmarked ? t("common.removeBookmark") : t("common.addBookmark")}
              </AppButton>
            </div>

            <div className="flex min-h-12 flex-col gap-1">
              <span className="line-clamp-1 text-base font-medium text-text-primary">
                {service.title}
              </span>
              <span className="line-clamp-1 text-sm text-text-secondary">
                {t("common.serviceDescription", { title: service.title.toLowerCase() })}
              </span>
            </div>

            <div className="dashed-divider" />

            <div className="flex items-center gap-2">
              <AppTag
                variant="secondary"
                shape="chip"
                leftIcon={UsersIcon}
                iconClassName="h-3 w-4 text-icon-secondary"
                className="p-2"
              >
                {t("common.personsCount", { count: String(service.persons).padStart(2, "0") })}
              </AppTag>
              <AppTag
                variant="secondary"
                shape="chip"
                leftIcon={ClockIcon}
                iconClassName="size-4 text-icon-secondary"
                className="p-2"
              >
                {t(DURATION_TRANSLATION_KEY[service.durationType ?? "minutes"] ?? DURATION_TRANSLATION_KEY.minutes, {
                  count: service.minutes,
                })}
              </AppTag>
            </div>
          </div>

          {service.providerName && (
            <span className="flex flex-wrap items-start gap-1 text-sm">
              <span className="text-text-primary">By:</span>
              <span className="inline-flex items-center gap-1 text-text-primary">
                {service.providerName}
                {service.providerVerified && (
                  <VerifiedBadgeIcon className="size-3.5 shrink-0 text-icon-brand" />
                )}
              </span>
            </span>
          )}

          <div className="flex items-center gap-6">
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-text-primary">
                  {priceText}
                </span>
                {service.discountPercent > 0 && (
                  <span className="text-sm text-text-secondary line-through">
                    {originalPriceText}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 text-sm text-text-success",
                  service.discountPercent <= 0 && "invisible"
                )}
              >
                <OfferTagIcon className="size-4" />
                {t("common.discountOff", { percent: service.discountPercent })}
              </span>
            </div>
            {quantity === 0 ? (
              <AppButton
                variant="primary-outline"
                size="md"
                aria-label={t("common.addToCartAriaLabel", { title: service.title })}
                onClick={(event) => {
                  event.preventDefault();
                  flyToCart(event.currentTarget, service.image);
                  addToCart();
                }}
                className="justify-center gap-0 overflow-hidden p-2 transition-all duration-300 hover:bg-bg-brand group-hover:gap-2 group-hover:border-bg-brand group-hover:bg-bg-brand"
              >
                <CartIcon className="size-6 shrink-0 text-button-primary-outline-text transition-colors duration-300 group-hover:text-white" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap font-medium text-white opacity-0 transition-all duration-300 group-hover:max-w-20 group-hover:opacity-100">
                  {t("common.add")}
                </span>
              </AppButton>
            ) : (
              <QuantitySelector
                quantity={quantity}
                onDecrease={decrease}
                onIncrease={increase}
                decreaseLabel={t("common.decreaseQuantityAriaLabel", { title: service.title })}
                increaseLabel={t("common.increaseQuantityAriaLabel", { title: service.title })}
              />
            )}
          </div>
        </div>
      </Link>
    </>
  );
}
