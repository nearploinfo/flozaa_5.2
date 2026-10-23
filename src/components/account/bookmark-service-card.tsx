"use client";

import { Link } from "@/components/ui/locale-link";
import { cn } from "@/lib/utils";
import { useShowPrice } from "@/lib/show-price";
import type { ServiceCardData } from "@/lib/services-catalog";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
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
import { formatRating } from "@/lib/helpers";

const DURATION_TRANSLATION_KEY: Record<"minutes" | "hours" | "days", string> = {
  minutes: "common.minutesCount",
  hours: "common.hoursCount",
  days: "common.daysCount",
};

export function BookmarkServiceCard({
  service,
  onBookmarkChange,
}: {
  service: ServiceCardData;
  onBookmarkChange?: (bookmarked: boolean) => void;
}) {
  const { t } = useTranslation();
  const priceText = useShowPrice(service.price);
  const originalPriceText = useShowPrice(service.originalPrice);
  const { toggle: toggleBookmark } = useBookmarkToggle({
    type: "service",
    id: service.serviceId ?? service.id,
    initialBookmarked: true,
    onToggled: onBookmarkChange,
  });

  const handleBookmarkClick = (event: React.MouseEvent) => {
    event.preventDefault();
    toggleBookmark();
  };

  return (
    <Link
      href={`/service-details/${service.id}`}
      className="flex w-full flex-col items-start gap-4 rounded-xl border border-border-default bg-bg-primary p-4"
    >
      <div className="flex w-full items-start gap-4">
        <div className="relative h-64 w-48 shrink-0 overflow-hidden rounded-lg">
          <AppImage src={service.image} alt={service.title} fill className="object-cover" />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-6">
            <div className="flex flex-1 flex-col items-start gap-2.5">
              {service.rating > 0 && (
                <AppTag
                  variant="warning"
                  shape="chip"
                  leftIcon={StarIcon}
                  iconClassName="text-bg-warning"
                >
                  {formatRating(service.rating)}
                </AppTag>
              )}
            </div>
            <AppButton
              variant="secondary-outline"
              size="sm"
              iconOnly
              leftIcon={(iconProps) => (
                <BookmarkIcon {...iconProps} filled className="size-5 text-bg-brand" />
              )}
              aria-pressed
              onClick={handleBookmarkClick}
              className="rounded-sm border-border-default bg-button-primary-text"
            >
              {t("common.removeBookmark")}
            </AppButton>
          </div>

          <div className="flex flex-col gap-1">
            <span className="line-clamp-1 text-base font-medium text-text-primary">{service.title}</span>
            <span className="line-clamp-1 text-sm text-text-secondary">
              {t("common.serviceDescription", { title: service.title.toLowerCase() })}
            </span>
          </div>

          <div className="dashed-divider" />

          <div className="flex items-center gap-2">
            <AppTag variant="secondary" shape="chip" leftIcon={UsersIcon} iconClassName="h-3 w-4 text-icon-secondary">
              {t("common.personsCount", { count: String(service.persons).padStart(2, "0") })}
            </AppTag>
            <AppTag variant="secondary" shape="chip" leftIcon={ClockIcon} iconClassName="size-4 text-icon-secondary">
              {t(
                DURATION_TRANSLATION_KEY[service.durationType ?? "minutes"] ?? "common.minutesCount",
                { count: service.minutes }
              )}
            </AppTag>
          </div>

          {service.providerName && (
            <span className="flex items-center gap-1 text-sm">
              <span className="text-text-primary">By:</span>
              <span className="flex items-center gap-1 text-text-primary">
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
                <span className="text-lg font-semibold text-text-primary">{priceText}</span>
                {service.discountPercent > 0 && (
                  <span className="text-sm text-text-secondary line-through">{originalPriceText}</span>
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
            <AppButton
              variant="primary-outline"
              size="md"
              iconOnly
              leftIcon={CartIcon}
              aria-label={t("common.addToCartAriaLabel", { title: service.title })}
              onClick={(event) => event.preventDefault()}
            >
              {t("common.add")}
            </AppButton>
          </div>
        </div>
      </div>
    </Link>
  );
}
