"use client";

import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import {
  ArrowRightIcon,
  ChatIcon,
  LocationPinIcon,
  StarIcon,
  VerifiedBadgeIcon,
} from "@/components/icons/icons";
import type { ServiceDetailProviderApi } from "@/lib/services-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";
import { formatDistance, formatRating } from "@/lib/helpers";
import { useDistanceUnit } from "@/lib/use-distance-unit";
import { buildChatHref } from "@/lib/chats/chat-types";

export function ServiceProviderSection({
  provider,
}: {
  provider: ServiceDetailProviderApi;
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const distanceUnit = useDistanceUnit();
  return (
    <>
      <ServiceProviderMobile provider={provider} />

      <div className="hidden flex-col items-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-primary p-6 xl:flex">
        <h2 className="self-stretch text-xl font-medium text-text-primary">
          {t("services.provider.title")}
        </h2>
        <div className="dashed-divider" />

        <div className="flex items-center gap-4 self-stretch">
          <Link href={`/provider-details/${provider.slug}`} className="shrink-0">
            <AppImage
              src={provider.image}
              alt={provider.company_name}
              className="size-16 rounded-lg border border-border-default object-cover"
            />
          </Link>
          <div className="flex flex-1 flex-col items-start gap-2">
            <span className="flex items-center gap-1">
              <Link
                href={`/provider-details/${provider.slug}`}
                className="text-xl font-medium text-text-primary transition-colors duration-200 hover:text-text-brand"
              >
                {provider.company_name}
              </Link>
              {provider.is_verified === 1 && (
                <VerifiedBadgeIcon
                  className="size-5 shrink-0 text-icon-brand"
                  aria-label={t("common.verified")}
                />
              )}
            </span>
            <div className="flex items-center gap-3">
              {provider.average_rating > 0 && (
                <span className="flex items-center gap-1">
                  <StarIcon className="size-5 shrink-0 text-icon-warning" />
                  <span className="text-lg text-text-secondary">
                    {formatRating(provider.average_rating)}
                  </span>
                </span>
              )}
              {provider.distance !== null && (
                <>
                  {provider.average_rating > 0 && (
                    <span className="size-1 rounded-full bg-bg-inverse opacity-40" />
                  )}
                  <span className="flex items-center gap-1">
                    <LocationPinIcon className="size-5 shrink-0 text-icon-secondary" />
                    <span className="text-lg text-text-secondary">
                      {formatDistance(provider.distance ?? 0, distanceUnit)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
          <AppButton variant="secondary" size="md" asChild>
            <Link
              href={buildChatHref(
                { partnerId: provider.id, bookingId: null, name: provider.company_name, image: provider.image },
                lang,
                defaultLocale
              )}
            >
              {t("common.chat")}
              <ChatIcon className="size-5 text-button-secondary-text" />
            </Link>
          </AppButton>
        </div>
      </div>
    </>
  );
}

/** max-lg layout: no card, compact provider row plus an all-services link. */
function ServiceProviderMobile({
  provider,
}: {
  provider: ServiceDetailProviderApi;
}) {
  const { t, lang, defaultLocale } = useTranslation();

  return (
    <section className="flex flex-col items-start gap-4 border-b border-dashed border-border-default py-6 xl:hidden">
      <h2 className="text-lg font-semibold text-text-primary">
        {t("services.provider.title")}
      </h2>

      <div className="flex items-center gap-3 self-stretch">
        <Link href={`/provider-details/${provider.slug}`} className="shrink-0">
          <AppImage
            src={provider.image}
            alt={provider.company_name}
            className="size-16 rounded-lg border border-border-default object-cover"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-center gap-1.5">
            <Link
              href={`/provider-details/${provider.slug}`}
              className="truncate text-sm font-semibold text-text-primary"
            >
              {provider.company_name}
            </Link>
            {provider.is_verified === 1 && (
              <VerifiedBadgeIcon
                className="size-4 shrink-0 text-icon-brand"
                aria-label={t("common.verified")}
              />
            )}
          </span>
          {provider.average_rating > 0 && (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <StarIcon className="size-4 shrink-0 text-icon-warning" />
                <span className="text-sm text-text-primary">
                  {formatRating(provider.average_rating)}
                </span>
              </span>
              <span className="h-4 w-px bg-border-default" />
              <span className="text-sm text-text-secondary">
                ({provider.number_of_ratings})
              </span>
            </span>
          )}
        </div>
        <AppButton
          variant="link"
          size="md"
          iconOnly
          asChild
          className="shrink-0 rounded-lg bg-bg-brand-subtle p-3"
        >
          <Link
            aria-label={t("common.chat")}
            href={buildChatHref(
              { partnerId: provider.id, bookingId: null, name: provider.company_name, image: provider.image },
              lang,
              defaultLocale
            )}
          >
            <ChatIcon className="size-5 text-icon-brand" />
          </Link>
        </AppButton>
      </div>

      <Link
        href={`/provider-details/${provider.slug}`}
        className="flex items-center gap-2 text-sm font-medium text-text-brand"
      >
        {t("services.provider.exploreAllServices")}
        <ArrowRightIcon className="size-4 shrink-0 rtl:rotate-180" />
      </Link>
    </section>
  );
}
