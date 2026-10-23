"use client";

import { Fragment, useEffect, useState } from "react";
import { Link } from "@/components/ui/locale-link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/ui/app-image";
import { useShowPrice } from "@/lib/show-price";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import {
  BookmarkIcon,
  ChevronArrowRightIcon,
  LocationPinIcon,
  ServiceCountIcon,
  ServiceDistanceIcon,
  StarIcon,
  VerifiedBadgeIcon,
} from "@/components/icons/icons";
import type { NearbyProvider } from "@/lib/providers-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useDistanceUnit } from "@/lib/use-distance-unit";
import { formatDistance, formatNextAvailable, formatRating } from "@/lib/helpers";
import { useBookmarkToggle } from "@/lib/use-bookmark-toggle";

export function ProviderCard({
  provider,
  style = "style-1",
  highlight,
  active,
  initialBookmarked,
  onBookmarkChange,
}: {
  provider: NearbyProvider;
  style?: "style-1" | "style-2";
  highlight?: "distance" | "rating";
  /** Forces the card's own hover appearance (border + shadow) permanently on — used to reflect a selected map pin. */
  active?: boolean;
  initialBookmarked?: boolean;
  onBookmarkChange?: (bookmarked: boolean) => void;
}) {
  const { t } = useTranslation();
  const distanceUnit = useDistanceUnit();
  const priceText = useShowPrice(provider.startingPrice);
  const [now, setNow] = useState<Date | undefined>(undefined);
  useEffect(() => setNow(new Date()), []);
  const { bookmarked, toggle: toggleBookmark } = useBookmarkToggle({
    type: "provider",
    id: provider.providerId ?? provider.id,
    initialBookmarked: initialBookmarked ?? provider.isBookmarked ?? false,
    onToggled: onBookmarkChange,
  });

  const handleBookmarkClick = (event: React.MouseEvent) => {
    event.preventDefault();
    toggleBookmark();
  };

  return (
    <>
      {/* Mobile — single Figma layout regardless of the desktop style-1/style-2 prop */}
      <Link
        href={provider.href}
        className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3 xl:hidden"
      >
        <div className="flex w-full items-start gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
            <AppImage src={provider.avatar} alt={provider.name} fill className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col items-start gap-2">
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex w-full min-w-0 items-center max-[360px]:flex-wrap">
                <span className="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold text-text-primary over-flow-hidden">
                  <span className="truncate max-w-[calc(100%-50px)]">{provider.name}</span>
                  {provider.verified && (
                    <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                  )}
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
              {provider.rating > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-bg-warning-subtle px-2 py-1">
                  <StarIcon className="size-3.5 text-icon-warning" />
                  <span className="text-xs text-text-primary">{formatRating(provider.rating)}</span>
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <ServiceCountIcon className="size-4 text-icon-secondary" />
                {t("common.servicesCount", { count: provider.serviceCount })}
              </span>
              <span className="size-1 rounded-full bg-bg-tertiary" />
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <ServiceDistanceIcon className="size-4 text-icon-secondary" />
                {formatDistance(provider.distanceKm, distanceUnit)}
              </span>
            </span>
          </div>
        </div>

        <div className="min-h-[34px] w-full overflow-hidden">
          {provider.nextAvailable && (
            <span className="line-clamp-1 block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-alert-success-bg p-2 text-xs text-text-success">
              {t("common.nextAvailable", { slot: formatNextAvailable(provider.nextAvailable, now) })}
            </span>
          )}
        </div>

        <div className="dashed-divider" />

        <div className="flex w-full items-center gap-4">
          <div className="flex flex-1 flex-col items-start justify-center">
            <span className="text-xs text-text-secondary">{t("common.startingFrom")}</span>
            <span className="text-sm font-semibold text-text-primary">
              {priceText}
            </span>
          </div>
          <span className="flex shrink-0 items-center justify-center rounded-3xl bg-bg-secondary p-2">
            <ChevronArrowRightIcon className="size-5 text-icon-primary rtl:rotate-180" />
          </span>
        </div>
      </Link>

      <ProviderCardDesktop
        provider={provider}
        style={style}
        highlight={highlight}
        active={active}
        bookmarked={bookmarked}
        onBookmarkClick={handleBookmarkClick}
        now={now}
      />
    </>
  );
}

function ProviderCardDesktop({
  provider,
  style,
  highlight,
  active,
  bookmarked,
  onBookmarkClick,
  now,
}: {
  provider: NearbyProvider;
  style: "style-1" | "style-2";
  highlight?: "distance" | "rating";
  active?: boolean;
  bookmarked: boolean;
  onBookmarkClick: (event: React.MouseEvent) => void;
  now?: Date;
}) {
  const { t } = useTranslation();
  const distanceUnit = useDistanceUnit();
  const priceText = useShowPrice(provider.startingPrice);

  if (style === "style-1") {
    const style1MetaOrder = (
      highlight === "distance"
        ? (["distance", "rating", "services"] as const)
        : highlight === "rating"
          ? (["rating", "services", "distance"] as const)
          : (["rating", "distance", "services"] as const)
    ).filter((key) => key !== "rating" || provider.rating > 0);

    const style1MetaEntries = {
      rating:
        highlight === "rating" ? (
          <AppTag
            key="rating"
            variant="warning"
            shape="chip"
            leftIcon={StarIcon}
            iconClassName="size-3.5 text-bg-warning"
          >
            {formatRating(provider.rating)}
          </AppTag>
        ) : (
          <span key="rating" className="flex shrink-0 items-center gap-1">
            <StarIcon className="size-3.5 text-icon-warning" />
            <span className="text-sm text-text-secondary">{formatRating(provider.rating)}</span>
          </span>
        ),
      distance:
        highlight === "distance" ? (
          <AppTag
            key="distance"
            variant="brand"
            shape="chip"
            leftIcon={LocationPinIcon}
            iconClassName="size-4 text-icon-brand"
          >
            {formatDistance(provider.distanceKm, distanceUnit)}
          </AppTag>
        ) : (
          <span key="distance" className="flex min-w-0 shrink items-center gap-1">
            <LocationPinIcon className="size-4 shrink-0 text-icon-secondary" />
            <span className="truncate text-sm whitespace-nowrap text-text-secondary">
              {formatDistance(provider.distanceKm, distanceUnit)}
            </span>
          </span>
        ),
      services: (
        <span key="services" className="flex shrink-0 items-center gap-1">
          <ServiceCountIcon className="size-4 text-icon-secondary" />
          <span className="text-sm whitespace-nowrap text-text-secondary">
            {t("common.servicesCount", { count: provider.serviceCount })}
          </span>
        </span>
      ),
    };

    return (
      <Link
        href={provider.href}
        className="group hidden w-full flex-col items-start gap-4 rounded-xl border border-border-default bg-bg-primary p-4 transition-all duration-200 hover:border-bg-brand hover:shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)] xl:flex"
      >
        <div className="relative aspect-378/190 w-full shrink-0 overflow-hidden rounded-lg">
          <AppImage
            src={provider.banner}
            alt={provider.name}
            fill
            className="h-full w-full rounded-lg object-cover"
          />
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
            onClick={onBookmarkClick}
            className="absolute right-3 top-3 rounded-sm border-border-default bg-bg-primary"
          >
            {bookmarked ? t("common.removeBookmark") : t("common.addBookmark")}
          </AppButton>
        </div>

        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center gap-3">
            <AppImage
              src={provider.avatar}
              alt={provider.name}
              className="size-14 shrink-0 rounded-lg object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
              <span className="line-clamp-2 block text-base font-medium text-text-primary">
                {/* Floated (not inline-block) so a long name's wrapped text
                    flows around the icon instead of the whole icon jumping
                    to its own new line when it doesn't fit after the last
                    word — the usual inline-block-in-wrapped-text failure. */}
                {provider.verified && (
                  <VerifiedBadgeIcon className="float-end ms-1 mt-1 size-4 shrink-0 text-icon-brand" />
                )}
                {provider.name}
              </span>
              <span className="flex w-full items-center gap-2 overflow-hidden">
                {style1MetaOrder.map((key, index) => (
                  <Fragment key={key}>
                    {index > 0 && (
                      <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
                    )}
                    {style1MetaEntries[key]}
                  </Fragment>
                ))}
              </span>
            </div>
          </div>

          <div className="min-h-6 w-full overflow-hidden">
            {provider.nextAvailable && (
              <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-alert-success-bg p-2 text-sm text-text-success">
                {t("common.nextAvailable", { slot: formatNextAvailable(provider.nextAvailable, now) })}
              </span>
            )}
          </div>

          <div className="dashed-divider" />

          <div className="flex w-full items-center gap-4">
            <div className="flex flex-1 flex-col items-start justify-center">
              <span className="text-sm text-text-secondary">
                {t("common.startingFrom")}
              </span>
              <span className="text-lg font-medium text-text-primary">
                {priceText}
              </span>
            </div>
            <AppButton
              asChild
              variant="primary-outline"
              size="md"
              className="justify-center gap-0 overflow-hidden rounded-lg p-2 transition-all duration-300 hover:bg-bg-brand group-hover:gap-2 group-hover:px-4 group-hover:border-bg-brand group-hover:bg-bg-brand"
            >
              <span>
                <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:max-w-32 group-hover:opacity-100">
                  {t("common.viewDetails")}
                </span>
                <ArrowRight className="size-4 shrink-0 text-button-primary-outline-text transition-colors duration-300 group-hover:text-white rtl:rotate-180" />
              </span>
            </AppButton>
          </div>
        </div>
      </Link>
    );
  }

  const metaEntries = {
    rating: (
      <span key="rating" className="flex shrink-0 items-center gap-1">
        <StarIcon className="size-3.5 text-icon-warning" />
        <span className="text-sm text-text-secondary">{formatRating(provider.rating)}</span>
      </span>
    ),
    distance: (
      <span key="distance" className="flex min-w-0 shrink items-center gap-1">
        <LocationPinIcon className="size-4 shrink-0 text-icon-secondary" />
        <span className="truncate text-sm whitespace-nowrap text-text-secondary">
          {formatDistance(provider.distanceKm, distanceUnit)}
        </span>
      </span>
    ),
    services: (
      <span key="services" className="flex shrink-0 items-center gap-1">
        <ServiceCountIcon className="size-4 text-icon-secondary" />
        <span className="text-sm whitespace-nowrap text-text-secondary">
          {t("common.servicesCount", { count: provider.serviceCount })}
        </span>
      </span>
    ),
  };
  // Whichever metric is called out above gets its own accent chip, so the
  // secondary row shows the other two — in the order Figma specifies per variant.
  const metaOrder = (
    highlight === "distance"
      ? (["rating", "services"] as const)
      : highlight === "rating"
        ? (["services", "distance"] as const)
        : (["rating", "distance", "services"] as const)
  ).filter((key) => key !== "rating" || provider.rating > 0);

  return (
    <Link
      href={provider.href}
      className={cn(
        "group hidden w-full flex-col items-start gap-4 rounded-xl border border-border-default bg-bg-primary p-4 transition-all duration-200 hover:border-bg-brand hover:shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)] xl:flex",
        active && "border-bg-brand shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]"
      )}
    >
      <div className="flex w-full items-center gap-3">
        <AppImage
          src={provider.avatar}
          alt={provider.name}
          className={cn(
            "shrink-0 rounded-lg object-cover",
            highlight ? "size-20" : "size-12"
          )}
        />
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <span className="line-clamp-2 block text-base font-medium text-text-primary">
              {/* See style-1's identical block above for why this is
                  floated instead of inline-block. */}
              {provider.verified && (
                <VerifiedBadgeIcon className="float-end ms-1 mt-1 size-4 shrink-0 text-icon-brand" />
              )}
              {provider.name}
            </span>
            {highlight === "distance" && (
              <AppTag
                variant="brand"
                shape="chip"
                leftIcon={LocationPinIcon}
                iconClassName="size-4 text-icon-brand"
              >
                {formatDistance(provider.distanceKm, distanceUnit)}
              </AppTag>
            )}
            {highlight === "rating" && provider.rating > 0 && (
              <AppTag
                variant="warning"
                shape="chip"
                leftIcon={StarIcon}
                iconClassName="size-3.5 text-bg-warning"
              >
                {formatRating(provider.rating)}
              </AppTag>
            )}
            <span className="flex w-full items-center gap-2 overflow-hidden">
              {metaOrder.map((key, index) => (
                <Fragment key={key}>
                  {index > 0 && (
                    <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
                  )}
                  {metaEntries[key]}
                </Fragment>
              ))}
            </span>
          </div>
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
            onClick={onBookmarkClick}
          >
            {bookmarked ? t("common.removeBookmark") : t("common.addBookmark")}
          </AppButton>
        </div>
      </div>

      <div className="min-h-9.5 w-full overflow-hidden">
        {provider.nextAvailable && (
          <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-alert-success-bg p-2 text-sm text-text-success">
            {t("common.nextAvailable", { slot: formatNextAvailable(provider.nextAvailable, now) })}
          </span>
        )}
      </div>

      <div className="dashed-divider" />

      <div className="flex w-full items-center gap-4">
        <div className="flex flex-1 flex-col items-start justify-center">
          <span className="text-sm text-text-secondary">{t("common.startingFrom")}</span>
          <span className="text-lg font-medium text-text-primary">{priceText}</span>
        </div>
        <AppButton
          asChild
          variant="primary-outline"
          size="md"
          className="justify-center gap-0 overflow-hidden rounded-lg p-2 transition-all duration-300 hover:bg-bg-brand group-hover:gap-2 group-hover:border-bg-brand group-hover:bg-bg-brand"
        >
          <span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:max-w-32 group-hover:opacity-100">
              {t("common.viewDetails")}
            </span>
            <ArrowRight className="size-4 shrink-0 text-button-primary-outline-text transition-colors duration-300 group-hover:text-white" />
          </span>
        </AppButton>
      </div>
    </Link>
  );
}
