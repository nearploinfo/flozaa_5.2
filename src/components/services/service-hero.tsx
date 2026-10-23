"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import {
  BookmarkIcon,
  CartIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CloseCircleIcon,
  GalleryIcon,
  OfferTagIcon,
  ShareIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons/icons";
import { normalizeDurationType, type ServiceDetailApi } from "@/lib/services-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { GalleryLightbox } from "@/components/ui/gallery-lightbox";
import { useShowPrice } from "@/lib/show-price";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { formatRating, reviewCountKey } from "@/lib/helpers";
import { useCartQuantity } from "@/lib/use-cart-quantity";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useBookmarkToggle } from "@/lib/use-bookmark-toggle";
import { manageCartApi } from "@/api/apiRoutes";
import { normalizeCartResponse, mergeCartData } from "@/lib/cart-types";
import { setCartData } from "@/store/slices/cart-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const DURATION_TRANSLATION_KEY: Record<string, string> = {
  minutes: "common.minutesCount",
  hours: "common.hoursCount",
  days: "common.daysCount",
};

/** API sends these flags as 1/"1"; they are optional on the service detail payload. */
function isFlagOn(value: number | string | undefined): boolean {
  return value === 1 || value === "1";
}

export function ServiceHero({
  service,
  onShare,
}: {
  service: ServiceDetailApi;
  onShare: () => void;
}) {
  const { bookmarked: saved, toggle: toggleSaved } = useBookmarkToggle({
    type: "service",
    id: service.id,
    initialBookmarked: service.is_bookmarked === 1,
  });
  const { t } = useTranslation();
  const galleryImages = [service.image, ...service.other_images];
  const [mainImage, ...thumbnails] = galleryImages;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const durationLabel = t(
    DURATION_TRANSLATION_KEY[normalizeDurationType(service.duration_type)],
    { count: service.duration }
  );
  const personsLabel = t("common.personsCount", {
    count: service.number_of_members_required,
  });

  const stats = [
    {
      icon: UsersIcon,
      value: personsLabel,
      label: t("services.hero.workers"),
    },
    {
      icon: ClockIcon,
      value: durationLabel,
      label: t("services.hero.duration"),
    },
    ...(service.total_bookings > 0
      ? [
          {
            icon: CheckIcon,
            value: service.total_bookings,
            label: t("services.hero.bookingsCompleted"),
          },
        ]
      : []),
  ];

  const allowances = [
    ...(isFlagOn(service.pay_later) ? [t("services.hero.payLaterAllowed")] : []),
    ...(isFlagOn(service.at_doorstep) ? [t("services.hero.doorstepAllowed")] : []),
    ...(isFlagOn(service.at_store) ? [t("services.hero.atStoreAllowed")] : []),
    ...(isFlagOn(service.is_cancellable) ? [t("services.hero.cancellableAllowed")] : []),
  ];

  return (
    <>
      <section className="bg-bg-primary max-xl:pt-2 xl:bg-bg-secondary commonPY">
        <ServiceHeroMobile
          service={service}
          mainImage={mainImage}
          thumbnails={thumbnails}
          saved={saved}
          onToggleSave={toggleSaved}
          onOpenLightbox={openLightbox}
        />

        <div className="container hidden items-start gap-6 flex-wrap xl:flex">
          <div className="flex-wrap flex flex-1 items-start gap-6 rounded-2xl xl:border border-border-default xl:bg-bg-primary xl:p-6">
            <div className="flex h-96 items-center gap-3">
              <div className="relative flex h-full items-center">
                <AppButton
                  variant="link"
                  onClick={() => openLightbox(0)}
                  className="aspect-424/551 h-96 shrink-0 p-0"
                >
                  <AppImage
                    src={mainImage}
                    alt={service.title}
                    className="aspect-424/551 h-96 rounded-lg object-cover"
                  />
                </AppButton>
                {thumbnails.length > 0 && (
                  <AppButton
                    variant="primary"
                    size="md"
                    leftIcon={GalleryIcon}
                    className="absolute bottom-2 right-2"
                    onClick={() => openLightbox(0)}
                  >
                    {t("services.hero.seeAllPhotos")}
                  </AppButton>
                )}
              </div>
              {thumbnails.length > 0 && (
                <div className="flex flex-col items-center justify-between h-full gap-3">
                  {thumbnails.slice(0, 3).map((thumbnail, index) => (
                    <AppButton
                      key={index}
                      variant="link"
                      onClick={() => openLightbox(index + 1)}
                      className="h-30 w-20 shrink-0 p-0"
                    >
                      <AppImage
                        src={thumbnail}
                        alt={`${service.title} photo ${index + 2}`}
                        className="h-30 w-20 rounded-md object-cover"
                      />
                    </AppButton>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-start gap-8 self-stretch">
              <div className="flex flex-1 flex-col items-start gap-8 self-stretch">
                <div className="flex flex-col items-start gap-6 self-stretch">
                  <div className="flex items-center justify-between self-stretch">
                    {service.average_rating > 0 ? (
                      <AppTag
                        variant="warning"
                        shape="chip"
                        leftIcon={StarIcon}
                        iconClassName="size-5 text-icon-warning"
                      >
                        <span className="text-lg font-medium text-text-primary">
                          {formatRating(service.average_rating)}
                        </span>
                        <span className="text-lg text-text-primary">
                          {t(reviewCountKey(service.number_of_ratings), { count: service.number_of_ratings })}
                        </span>
                      </AppTag>
                    ) : (
                      <span />
                    )}
                    <AppButton
                      variant="secondary-outline"
                      size="md"
                      iconOnly
                      leftIcon={(props) => (
                        <BookmarkIcon
                          {...props}
                          filled={saved}
                          className={
                            saved
                              ? "size-5 shrink-0 text-bg-brand"
                              : "size-5 shrink-0 text-button-secondary-outline-text"
                          }
                        />
                      )}
                      aria-pressed={saved}
                      aria-label={saved ? t("services.hero.removeFromSaved") : t("services.hero.saveService")}
                      onClick={toggleSaved}
                    >
                      {saved ? t("services.hero.removeFromSaved") : t("services.hero.saveService")}
                    </AppButton>
                  </div>
                  <div className="flex flex-col items-start gap-4 self-stretch">
                    <div className="flex flex-col items-start gap-3 self-stretch">
                      <div className="flex flex-col items-start gap-2 self-stretch">
                        <h1 className="self-stretch text-xl font-medium text-text-primary">
                          {service.title}
                        </h1>
                        <p className="self-stretch text-base text-text-secondary">
                          {service.short_description}
                        </p>
                      </div>
                    </div>
                    {allowances.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {allowances.map((allowance, index) => (
                          <span key={allowance} className="flex items-center gap-2">
                            {index > 0 && (
                              <span className="size-1 rounded-full bg-bg-inverse opacity-40" />
                            )}
                            <CheckCircleIcon className="size-4 shrink-0 text-icon-primary" />
                            <span className="text-sm text-text-primary">{allowance}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap 2xl:grid w-full grid-cols-3 gap-3">
                  {stats.map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2"
                    >
                      <AppTag
                        shape="box"
                        className="size-9 shrink-0 rounded-sm"
                        leftIcon={Icon}
                        iconClassName="size-5 text-icon-primary"
                      />
                      <div className="flex flex-col items-start justify-center gap-0.5">
                        <span className="text-base font-medium text-text-primary">
                          {value}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 self-stretch rounded-lg border border-border-default p-4">
                <span className="flex-1 text-sm font-medium text-text-primary">
                  {t("services.hero.shareThisService")}
                </span>
                <AppButton
                  variant="link"
                  size="sm"
                  leftIcon={ShareIcon}
                  onClick={onShare}
                >
                  {t("common.share")}
                </AppButton>
              </div>
            </div>
          </div>

          <ServiceBookingCard service={service} />
        </div>

        <GalleryLightbox
          images={galleryImages}
          title={service.title}
          open={lightboxOpen}
          activeIndex={activeImageIndex}
          onOpenChange={setLightboxOpen}
          onActiveIndexChange={setActiveImageIndex}
        />
      </section>
    </>
  );
}

/** max-lg layout: stacked gallery, meta, and an inline price/cart row. */
function ServiceHeroMobile({
  service,
  mainImage,
  thumbnails,
  saved,
  onToggleSave,
  onOpenLightbox,
}: {
  service: ServiceDetailApi;
  mainImage: string;
  thumbnails: string[];
  saved: boolean;
  onToggleSave: () => void;
  onOpenLightbox: (index: number) => void;
}) {
  const { t } = useTranslation();
  const { quantity, addToCart, increase, decrease } = useCartQuantity({ serviceId: service.id });
  const hasDiscount = service.discounted_price > 0;
  const currentPriceText = useShowPrice(hasDiscount ? service.discounted_price : service.price);
  const fullPriceText = useShowPrice(service.price);
  const visibleThumbnails = thumbnails.slice(0, 3);
  const hiddenPhotoCount = thumbnails.length - visibleThumbnails.length;

  const allowances = [
    ...(isFlagOn(service.pay_later) ? [t("services.hero.payLaterAllowed")] : []),
    ...(isFlagOn(service.at_doorstep) ? [t("services.hero.doorstepAllowed")] : []),
    ...(isFlagOn(service.at_store) ? [t("services.hero.atStoreAllowed")] : []),
    ...(isFlagOn(service.is_cancellable) ? [t("services.hero.cancellableAllowed")] : []),
  ];

  return (
    <div className="container flex flex-col gap-4 xl:hidden">
      <div className="flex items-stretch gap-2">
        <AppButton
          variant="link"
          onClick={() => onOpenLightbox(0)}
          aria-label={t("common.gallery.allPhotos")}
          className="h-64 flex-1 p-0"
        >
          <AppImage
            src={mainImage}
            alt={service.title}
            className="h-64 w-full rounded-xl object-cover"
          />
        </AppButton>
        {visibleThumbnails.length > 0 && (
          <div className="flex w-20 shrink-0 flex-col gap-2">
            {visibleThumbnails.map((thumbnail, index) => {
              const isViewAllTile =
                hiddenPhotoCount > 0 && index === visibleThumbnails.length - 1;
              return (
                <AppButton
                  key={index}
                  variant="link"
                  onClick={() => onOpenLightbox(index + 1)}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg p-0"
                >
                  <AppImage
                    src={thumbnail}
                    alt={`${service.title} photo ${index + 2}`}
                    className="size-20 rounded-lg object-cover"
                  />
                  {isViewAllTile && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-sm font-medium text-white">
                      {t("common.viewAll")}
                    </span>
                  )}
                </AppButton>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {service.average_rating > 0 ? (
          <span className="flex items-center gap-1">
            <StarIcon className="size-4 shrink-0 text-icon-warning" />
            <span className="text-sm font-medium text-text-primary">
              {formatRating(service.average_rating)}
            </span>
            <span className="text-sm text-text-secondary">
              {t(reviewCountKey(service.number_of_ratings), { count: service.number_of_ratings })}
            </span>
          </span>
        ) : (
          <span />
        )}
        <AppButton
          variant="link"
          size="sm"
          iconOnly
          className="p-0"
          leftIcon={(props) => (
            <BookmarkIcon
              {...props}
              filled={saved}
              className={
                saved
                  ? "size-6 shrink-0 text-bg-brand"
                  : "size-6 shrink-0 text-icon-primary"
              }
            />
          )}
          aria-pressed={saved}
          aria-label={saved ? t("services.hero.removeFromSaved") : t("services.hero.saveService")}
          onClick={onToggleSave}
        >
          {saved ? t("services.hero.removeFromSaved") : t("services.hero.saveService")}
        </AppButton>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-text-primary">{service.title}</h1>
        <p className="text-sm text-text-secondary">{service.short_description}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <UsersIcon className="size-4 shrink-0 text-icon-primary" />
          <span className="text-sm text-text-primary">
            {t("common.personsCount", { count: service.number_of_members_required })}
          </span>
        </span>
        <span className="h-4 w-px bg-border-default" />
        <span className="flex items-center gap-1.5">
          <ClockIcon className="size-4 shrink-0 text-icon-primary" />
          <span className="text-sm text-text-primary">
            {t(
              DURATION_TRANSLATION_KEY[normalizeDurationType(service.duration_type)],
              { count: service.duration }
            )}
          </span>
        </span>
      </div>

      {allowances.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {allowances.map((allowance) => (
            <span key={allowance} className="flex items-center gap-1.5">
              <CheckCircleIcon className="size-[18px] shrink-0 text-bg-brand" />
              <span className="text-sm text-text-primary">{allowance}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border-default pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-text-primary">
              {currentPriceText}
            </span>
            {hasDiscount && (
              <span className="text-base text-text-secondary line-through">
                {fullPriceText}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="flex items-center gap-1">
              <OfferTagIcon className="size-4 shrink-0 text-icon-success" />
              <span className="text-sm text-text-success">
                {t("services.hero.discountOff", { percent: service.discount_percentage })}
              </span>
            </span>
          )}
        </div>
        {quantity === 0 ? (
          <AppButton
            variant="secondary-outline"
            size="md"
            leftIcon={CartIcon}
            onClick={addToCart}
          >
            {t("services.hero.addToCart")}
          </AppButton>
        ) : (
          <QuantitySelector
            quantity={quantity}
            onDecrease={decrease}
            onIncrease={increase}
            decreaseLabel={t("common.decreaseQuantityAriaLabel", { title: service.title })}
            increaseLabel={t("common.increaseQuantityAriaLabel", { title: service.title })}
            className="px-3 py-1.5"
          />
        )}
      </div>
    </div>
  );
}

export function ServiceBookingCard({ service }: { service: ServiceDetailApi }) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartData = useAppSelector((state) => state.cart.data);
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const { requireAuth } = useRequireAuth();
  const { quantity, addToCart, increase, decrease } = useCartQuantity({ serviceId: service.id });
  const hasDiscount = service.discounted_price > 0;
  const currentPriceText = useShowPrice(hasDiscount ? service.discounted_price : service.price);
  const fullPriceText = useShowPrice(service.price);
  const [inclusionTab, setInclusionTab] = useState<"included" | "excluded">(
    service.whats_included.length > 0 ? "included" : "excluded"
  );
  const inclusionItems =
    inclusionTab === "included" ? service.whats_included : service.whats_excluded;
  const [bookingNow, setBookingNow] = useState(false);

  const handleBookNow = () =>
    requireAuth(async () => {
      setBookingNow(true);
      try {
        let cartId = cartData?.carts.find((group) => group.providerId === service.provider.id)?.cartId ?? null;
        if (!cartId) {
          const response = await manageCartApi({
            service_id: service.id,
            qty: Math.max(quantity, 1),
            from_new_app: 1,
          });
          if (response?.error) throw new Error(response?.message);
          const normalized = normalizeCartResponse(response?.data);
          dispatch(setCartData(mergeCartData(cartData, normalized)));
          cartId = normalized?.carts.find((group) => group.providerId === service.provider.id)?.cartId ?? null;
        }
        if (!cartId) throw new Error(t("common.cart.error"));
        router.push(localizePath(`/checkout?cartId=${cartId}`, lang, defaultLocale));
      } catch (error) {
        toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
      } finally {
        setBookingNow(false);
      }
    });

  return (
    <div className="flex w-96 flex-col items-start gap-6 self-stretch overflow-hidden rounded-xl border border-border-default bg-bg-primary p-4">
      <div className="flex items-center gap-4 self-stretch">
        <div className="flex flex-1 items-center gap-1">
          <span className="text-2xl font-medium text-text-primary">
            {currentPriceText}
          </span>
          {hasDiscount && (
            <span className="text-xl text-text-secondary line-through">
              {fullPriceText}
            </span>
          )}
        </div>
        {hasDiscount && (
          <AppTag variant="success" shape="chip">
            <span className="text-sm text-text-success">
              {t("services.hero.discountOff", { percent: service.discount_percentage })}
            </span>
          </AppTag>
        )}
      </div>

      <div className="dashed-divider" />

      <div className="flex flex-1 flex-col items-start gap-4 self-stretch rounded-xl">
        <div className="flex w-full items-start gap-0 rounded-lg bg-bg-secondary p-2">
          <button
            type="button"
            onClick={() => setInclusionTab("included")}
            aria-pressed={inclusionTab === "included"}
            disabled={service.whats_included.length === 0}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg p-2 text-sm ${
              inclusionTab === "included" && service.whats_included.length > 0
                ? "bg-bg-primary font-medium text-text-brand shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)] outline outline-1 -outline-offset-1 outline-border-default"
                : "text-text-secondary disabled:opacity-50"
            }`}
          >
            {t("services.about.whatsIncluded")}
          </button>
          <button
            type="button"
            onClick={() => setInclusionTab("excluded")}
            aria-pressed={inclusionTab === "excluded"}
            disabled={service.whats_excluded.length === 0}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg p-2 text-sm ${
              inclusionTab === "excluded" && service.whats_excluded.length > 0
                ? "bg-bg-primary font-medium text-text-brand shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)] outline outline-1 -outline-offset-1 outline-border-default"
                : "text-text-secondary disabled:opacity-50"
            }`}
          >
            {t("services.about.whatsExcluded")}
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={inclusionTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {inclusionItems.length > 0 ? (
              <div className="flex flex-col items-start gap-3 self-stretch">
                {inclusionItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 self-stretch">
                    {inclusionTab === "included" ? (
                      <CheckCircleIcon className="size-5 shrink-0 text-bg-brand" />
                    ) : (
                      <CloseCircleIcon className="size-5 shrink-0 text-icon-error" />
                    )}
                    <span className="flex-1 text-sm text-text-primary">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-text-secondary">
                {inclusionTab === "included"
                  ? t("services.hero.noInclusionsListed")
                  : t("services.hero.noExclusionsListed")}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="dashed-divider" />

      <div className="mt-auto flex items-start gap-4 self-stretch">
        {quantity === 0 ? (
          <AppButton
            variant="secondary-outline"
            size="md"
            leftIcon={CartIcon}
            className="flex-1"
            onClick={addToCart}
          >
            {t("services.hero.addToCart")}
          </AppButton>
        ) : (
          <QuantitySelector
            quantity={quantity}
            onDecrease={decrease}
            onIncrease={increase}
            decreaseLabel={t("common.decreaseQuantityAriaLabel", { title: service.title })}
            increaseLabel={t("common.increaseQuantityAriaLabel", { title: service.title })}
            className="flex-1"
          />
        )}
        <AppButton variant="primary" size="md" className="flex-1" disabled={bookingNow} onClick={handleBookNow}>
          {t("services.hero.bookNow")}
        </AppButton>
      </div>
    </div>
  );
}
