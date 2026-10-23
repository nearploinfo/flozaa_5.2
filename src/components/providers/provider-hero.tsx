"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { parse, format, isValid } from "date-fns";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import { Link } from "@/components/ui/locale-link";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AddressOfficeIcon,
  ArrowLeftIcon,
  BookmarkIcon,
  ChatIcon,
  CheckIcon,
  CircleCheckBadgeIcon,
  DoorstepIcon,
  LocationPinIcon,
  OfferTagIcon,
  ProviderStoreIcon,
  ShareIcon,
  StarIcon,
  VerifiedBadgeIcon,
} from "@/components/icons/icons";
import {
  toJobsCompletedLabel,
  toReviewLabel,
  type ProviderDetailApi,
} from "@/lib/providers-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";
import { formatDistance, formatRating } from "@/lib/helpers";
import { useDistanceUnit } from "@/lib/use-distance-unit";
import { useBookmarkToggle } from "@/lib/use-bookmark-toggle";
import { ShareModal } from "@/components/ui/share-modal";
import { buildChatHref } from "@/lib/chats/chat-types";
import { getAllPromocodesApi, type PromoCodeApi } from "@/api/apiRoutes";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import { usePriceFormatter } from "@/lib/show-price";

export function ProviderHero({ provider }: { provider: ProviderDetailApi }) {
  const [shareOpen, setShareOpen] = useState(false);
  const { t, lang, defaultLocale } = useTranslation();
  const distanceUnit = useDistanceUnit();
  const avatar = provider.profile_image || provider.other_images[0] || provider.banner;
  const { bookmarked: saved, toggle: toggleSaved } = useBookmarkToggle({
    type: "provider",
    id: provider.partner_id,
    initialBookmarked: provider.is_bookmarked === 1,
  });
  const serviceModeLabel =
    provider.at_store === 1 && provider.at_doorstep === 1
      ? t("providerDetails.hero.storeAndDoorstepAllowed")
      : provider.at_store === 1
        ? t("providerDetails.hero.storeAllowed")
        : provider.at_doorstep === 1
          ? t("providerDetails.hero.doorstepAllowedChip")
          : null;

  return (
    <>
      <ProviderHeroMobile provider={provider} saved={saved} onToggleSaved={toggleSaved} />

      <section className="hidden bg-bg-secondary py-12 xl:block">
        <div className="container flex items-stretch flex-wrap gap-6">
          <div className="flex w-[658px] shrink-0 flex-col items-center gap-6 rounded-xl border border-border-default bg-bg-primary p-6">
            <AppImage
              src={provider.banner}
              alt={provider.company_name}
              className="aspect-378/190 w-full self-stretch rounded-lg object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col items-start gap-6 rounded-xl border border-border-default bg-bg-primary p-6">
            {Number(provider.average_rating) > 0 && (
              <>
                <div className="flex items-center gap-4 self-stretch">
                  <AppTag
                    variant="default"
                    shape="pill"
                    leftIcon={StarIcon}
                    iconClassName="text-icon-warning"
                    className="py-2 text-base text-text-primary"
                  >
                    <span>{formatRating(provider.average_rating)}</span>
                    <span>{toReviewLabel(provider.number_of_ratings)}</span>
                  </AppTag>
                </div>
                <div className="dashed-divider" />
              </>
            )}

            <div className="flex items-center gap-4 self-stretch">
              <AppImage
                src={avatar}
                alt={provider.company_name}
                className="size-14 rounded-lg border border-border-default object-cover"
              />
              <div className="flex flex-1 flex-col items-start gap-2">
                <div className="flex items-center gap-2 self-stretch">
                  <span className="flex flex-1 items-center gap-1 text-xl font-medium text-text-primary">
                    {provider.company_name}
                    {provider.is_verified === 1 && (
                      <VerifiedBadgeIcon
                        className="size-5 shrink-0 text-icon-brand"
                        aria-label={t("common.verified")}
                      />
                    )}
                  </span>
                  {provider.number_of_orders > 0 && (
                    <AppTag
                      variant="default"
                      shape="pill"
                      leftIcon={CircleCheckBadgeIcon}
                      iconClassName="size-4 text-icon-brand"
                      className="w-fit shrink-0 gap-1 rounded-full bg-bg-brand-subtle px-2 py-1 text-sm font-medium text-text-brand"
                    >
                      {toJobsCompletedLabel(provider.number_of_orders)}
                    </AppTag>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-2">
                    <AddressOfficeIcon className="size-4 text-icon-primary" />
                    <span className="text-base text-text-primary">
                      {provider.provider_type === "organization"
                        ? t("providerDetails.hero.organization")
                        : t("providerDetails.hero.individual")}
                    </span>
                  </span>
                  {serviceModeLabel && (
                    <>
                      <span className="size-1 rounded-full bg-bg-inverse opacity-40" />
                      <span className="flex items-center gap-2">
                        <ProviderStoreIcon className="size-3.5 text-icon-primary" />
                        <span className="text-base text-text-primary">{serviceModeLabel}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="line-clamp-3 flex-1 self-stretch text-base text-text-secondary">
              {provider.about}
            </p>

            <div className="flex items-center gap-4 self-stretch">
              {provider.distance !== null && (
                <AppTag
                  variant="brand"
                  shape="pill"
                  leftIcon={LocationPinIcon}
                  iconClassName="size-5 text-icon-primary"
                  className="py-2 text-base text-text-primary"
                >
                  {t("providerDetails.hero.distanceLabel", {
                    distance: formatDistance(provider.distance ?? 0, distanceUnit),
                  })}
                </AppTag>
              )}
              <div className="flex flex-1 items-center justify-end gap-3">
                <AppButton
                  variant="secondary-outline"
                  size="md"
                  leftIcon={ShareIcon}
                  iconOnly
                  aria-label={t("providerDetails.hero.share")}
                  onClick={() => setShareOpen(true)}
                >
                  {t("providerDetails.hero.share")}
                </AppButton>
                <AppButton
                  variant="secondary-outline"
                  size="md"
                  iconOnly
                  leftIcon={(iconProps) => (
                    <BookmarkIcon
                      {...iconProps}
                      filled={saved}
                      className={
                        saved
                          ? "size-6 text-bg-brand"
                          : "size-6 text-button-secondary-outline-text"
                      }
                    />
                  )}
                  aria-pressed={saved}
                  aria-label={saved ? t("providerDetails.hero.removeFromSaved") : t("providerDetails.hero.saveProvider")}
                  onClick={toggleSaved}
                >
                  {saved ? t("providerDetails.hero.removeFromSaved") : t("providerDetails.hero.saveProvider")}
                </AppButton>
                {provider.pre_booking_chat_allowed === 1 && (
                  <AppButton asChild variant="secondary" size="md">
                    <Link
                      href={buildChatHref(
                        { partnerId: provider.partner_id, bookingId: null, name: provider.company_name, image: avatar },
                        lang,
                        defaultLocale
                      )}
                    >
                      <span className="text-base text-button-secondary-text">
                        {t("common.chat")}
                      </span>
                      <ChatIcon className="size-6 text-button-secondary-text" />
                    </Link>
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        </div>

        <ShareModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          url={typeof window === "undefined" ? "" : window.location.href}
          title={provider.company_name}
        />
      </section>
    </>
  );
}

/** max-lg layout: full-bleed banner with floating actions and an overlapping info card. */
function ProviderHeroMobile({
  provider,
  saved,
  onToggleSaved,
}: {
  provider: ProviderDetailApi;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const distanceUnit = useDistanceUnit();
  const [shareOpen, setShareOpen] = useState(false);
  const [headerPinned, setHeaderPinned] = useState(false);
  const avatar = provider.profile_image || provider.other_images[0] || provider.banner;

  // The floating banner actions scroll away with the hero — swap in the
  // standard mobile header (back + provider name) once they're gone.
  useEffect(() => {
    const handleScroll = () => setHeaderPinned(window.scrollY > 160);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const serviceModeLabel =
    provider.at_store === 1 && provider.at_doorstep === 1
      ? t("providerDetails.hero.storeAndDoorstepAllowed")
      : provider.at_store === 1
        ? t("providerDetails.hero.storeAllowed")
        : provider.at_doorstep === 1
          ? t("providerDetails.hero.doorstepAllowedChip")
          : null;

  return (
    <section className="relative xl:hidden">
      {headerPinned && (
        <div className="fixed inset-x-0 top-0 z-40 border-b border-border-default bg-bg-primary">
          <MobileBreadcrum
            title={provider.company_name}
            headerAction={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  aria-label={t("providerDetails.hero.share")}
                >
                  <ShareIcon className="size-5 text-icon-primary" />
                </button>
                <button
                  type="button"
                  onClick={onToggleSaved}
                  aria-pressed={saved}
                  aria-label={
                    saved
                      ? t("providerDetails.hero.removeFromSaved")
                      : t("providerDetails.hero.saveProvider")
                  }
                >
                  <BookmarkIcon
                    filled={saved}
                    className={saved ? "size-5 text-bg-brand" : "size-5 text-icon-primary"}
                  />
                </button>
              </div>
            }
          />
        </div>
      )}

      <AppImage
        src={provider.banner}
        alt={provider.company_name}
        className="aspect-378/190 w-full object-cover"
      />

      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("providerDetails.hero.back")}
          className="flex size-9 items-center justify-center rounded-full bg-bg-primary/90"
        >
          <ArrowLeftIcon className="size-5 text-icon-primary rtl:rotate-180" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label={t("providerDetails.hero.share")}
            className="flex size-9 items-center justify-center rounded-full bg-bg-primary/90"
          >
            <ShareIcon className="size-5 text-icon-primary" />
          </button>
          <button
            type="button"
            onClick={onToggleSaved}
            aria-pressed={saved}
            aria-label={
              saved
                ? t("providerDetails.hero.removeFromSaved")
                : t("providerDetails.hero.saveProvider")
            }
            className="flex size-9 items-center justify-center rounded-full bg-bg-primary/90"
          >
            <BookmarkIcon
              filled={saved}
              className={saved ? "size-5 text-bg-brand" : "size-5 text-icon-primary"}
            />
          </button>
        </div>
      </div>

      <div className="container relative -mt-12">
        <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-primary p-4 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <AppImage
              src={avatar}
              alt={provider.company_name}
              className="size-14 shrink-0 rounded-lg border border-border-default object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-base font-semibold text-text-primary">
                  {provider.company_name}
                </span>
                {provider.is_verified === 1 && (
                  <VerifiedBadgeIcon
                    className="size-4 shrink-0 text-icon-brand"
                    aria-label={t("common.verified")}
                  />
                )}
              </span>
              {Number(provider.average_rating) > 0 && (
                <span className="flex items-center gap-1">
                  <StarIcon className="size-4 shrink-0 text-icon-warning" />
                  <span className="text-sm font-medium text-text-primary">
                    {formatRating(provider.average_rating)}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {toReviewLabel(provider.number_of_ratings)}
                  </span>
                </span>
              )}
            </div>
            {provider.pre_booking_chat_allowed === 1 && (
              <AppButton
                asChild
                variant="link"
                size="md"
                iconOnly
                className="shrink-0 rounded-lg bg-bg-brand-subtle p-3"
              >
                <Link
                  aria-label={t("common.chat")}
                  href={buildChatHref(
                    { partnerId: provider.partner_id, bookingId: null, name: provider.company_name, image: avatar },
                    lang,
                    defaultLocale
                  )}
                >
                  <ChatIcon className="size-5 text-icon-brand" />
                </Link>
              </AppButton>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {serviceModeLabel && (
              <AppTag
                variant="secondary"
                shape="chip"
                leftIcon={provider.at_store === 1 ? ProviderStoreIcon : DoorstepIcon}
                iconClassName="size-4 text-icon-secondary"
                className="shrink-0 whitespace-nowrap py-1.5 text-xs text-text-secondary"
              >
                {serviceModeLabel}
              </AppTag>
            )}
            {provider.number_of_orders > 0 && (
              <AppTag
                variant="secondary"
                shape="chip"
                leftIcon={CheckIcon}
                iconClassName="size-4 text-icon-secondary"
                className="shrink-0 whitespace-nowrap py-1.5 text-xs text-text-secondary"
              >
                {t("providerDetails.hero.jobsCompletedCount", { count: provider.number_of_orders })}
              </AppTag>
            )}
            {provider.distance !== null && (
              <AppTag
                variant="secondary"
                shape="chip"
                leftIcon={LocationPinIcon}
                iconClassName="size-4 text-icon-secondary"
                className="shrink-0 whitespace-nowrap py-1.5 text-xs text-text-secondary"
              >
                {t("providerDetails.hero.distanceLabel", {
                  distance: formatDistance(provider.distance ?? 0, distanceUnit),
                })}
              </AppTag>
            )}
          </div>

          <ProviderHeroOffers providerId={provider.partner_id} />
        </div>
      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={typeof window === "undefined" ? "" : window.location.href}
        title={provider.company_name}
      />
    </section>
  );
}

function formatOfferExpiry(rawDate: string): string {
  // Live API returns dd-MM-yyyy regardless of the documented yyyy-MM-dd example.
  const parsed = parse(rawDate, "dd-MM-yyyy", new Date());
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : rawDate;
}

/** Compact offer rail shown inside the max-lg hero card — same promocodes as the Offers tab. */
function ProviderHeroOffers({ providerId }: { providerId: number }) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [offers, setOffers] = useState<PromoCodeApi[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<PromoCodeApi | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAllPromocodesApi({ provider_id: providerId, limit: 6 })
      .then((response) => {
        if (cancelled) return;
        setOffers(response?.error ? [] : (response?.data ?? []));
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  useEffect(() => {
    if (offers.length <= 1 || selectedOffer) return;
    const interval = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const width = track.clientWidth || 1;
      const nextIndex = (Math.round(track.scrollLeft / width) + 1) % offers.length;
      track.scrollTo({ left: nextIndex * width, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(interval);
  }, [offers.length, selectedOffer]);

  if (offers.length === 0) return null;

  const discountLabel = (offer: PromoCodeApi) =>
    offer.discount_type === "percentage"
      ? t("checkoutPage.coupons.percentOff", { percent: offer.discount })
      : t("checkoutPage.coupons.amountOff", { amount: showPrice(offer.discount) });

  const offerTerms = (offer: PromoCodeApi) =>
    [
      offer.message || null,
      t("checkoutPage.coupons.minimumOrderTerm", {
        amount: showPrice(offer.minimum_order_amount),
      }),
      t("checkoutPage.coupons.maxDiscountTerm", {
        amount: showPrice(offer.max_discount_amount),
      }),
      t("checkoutPage.coupons.validFromTerm", {
        start: formatOfferExpiry(offer.start_date),
        end: formatOfferExpiry(offer.end_date),
      }),
      offer.no_of_repeat_usage > 1
        ? t("checkoutPage.coupons.limitedUsesTerm", { count: offer.no_of_repeat_usage })
        : t("checkoutPage.coupons.validOnceTerm"),
    ].filter((term): term is string => Boolean(term));

  return (
    <div className="flex flex-col gap-2 border-t border-dashed border-border-default pt-3">
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          const width = track.clientWidth || 1;
          setActiveIndex(Math.round(track.scrollLeft / width));
        }}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto"
      >
        {offers.map((offer) => (
          <button
            key={offer.id}
            type="button"
            onClick={() => setSelectedOffer(offer)}
            className="flex w-full shrink-0 snap-start items-center gap-3 rounded-lg bg-bg-brand-subtle p-3 text-start"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-primary">
              <OfferTagIcon className="size-5 text-icon-brand" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold text-text-primary">
                {discountLabel(offer)}
              </span>
              <span className="truncate text-xs text-text-secondary">
                {t("providerDetails.hero.offerMinimum", {
                  amount: showPrice(offer.minimum_order_amount),
                })}
              </span>
            </div>
            <span className="shrink-0 text-xs text-text-secondary">
              {offers.indexOf(offer) + 1}/{offers.length}
            </span>
          </button>
        ))}
      </div>
      {offers.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {offers.map((offer, index) => (
            <span
              key={offer.id}
              className={
                index === activeIndex
                  ? "size-1.5 rounded-full bg-bg-brand"
                  : "size-1.5 rounded-full bg-border-default"
              }
            />
          ))}
        </div>
      )}

      <Drawer open={selectedOffer !== null} onOpenChange={(open) => !open && setSelectedOffer(null)}>
        <DrawerContent className="bg-bg-primary xl:hidden">
          <DrawerHeader className="border-b border-border-default px-4 pb-3">
            <DrawerTitle className="text-base font-semibold text-text-primary">
              {selectedOffer?.promo_code}
            </DrawerTitle>
          </DrawerHeader>
          {selectedOffer && (
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                {selectedOffer.image && (
                  <AppImage
                    src={selectedOffer.image}
                    alt={selectedOffer.promo_code}
                    className="size-12 shrink-0 rounded-lg border border-border-default object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-sm font-medium text-text-primary">
                    {discountLabel(selectedOffer)}
                  </span>
                  {selectedOffer.end_date && (
                    <span className="text-sm text-text-secondary">
                      {t("checkoutPage.coupons.expiresOn", {
                        date: formatOfferExpiry(selectedOffer.end_date),
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="dashed-divider" />
              <ul className="flex w-full flex-col items-start gap-1">
                {offerTerms(selectedOffer).map((term) => (
                  <li key={term} className="text-sm text-text-primary">
                    • {term}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
