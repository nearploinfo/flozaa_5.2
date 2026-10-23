"use client";

import { useEffect, useMemo, useState } from "react";
import { AppImage } from "@/components/ui/app-image";
import { AppTag } from "@/components/ui/app-tag";
import { AppButton } from "@/components/ui/app-button";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { GalleryLightbox } from "@/components/ui/gallery-lightbox";
import { ArrowRightIcon, StarIcon } from "@/components/icons/icons";
import { getRatingsApi } from "@/api/apiRoutes";
import type {
  ServiceRatingApi,
  ServiceRatingsResponse,
  ServiceRatingsSort,
} from "@/lib/services-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";
import { formatDateTime, formatRating, formatRelativeTime, reviewCountKey } from "@/lib/helpers";

type SortValue = ServiceRatingsSort;

const PAGE_SIZE = 5;

/** Thumbnails shown on a max-lg review card before the last tile becomes a "+N" overlay. */
const MOBILE_PHOTO_LIMIT = 4;

export function ReviewsSection({
  serviceSlug,
  providerSlug,
  average,
  totalRatings,
  ratingBreakdown,
  mobileLayout = "rail",
}: {
  serviceSlug?: string;
  providerSlug: string;
  average: number;
  totalRatings: number;
  /** max-lg presentation: "rail" swipes through reviews behind a View All link, "list" stacks them under a sort control. */
  mobileLayout?: "rail" | "list";
  /** Accurate counts across all reviews (e.g. get_provider_details' rating_breakdown). When omitted, falls back to computing percentages from only the currently loaded page of reviews — approximate, kept for callers that don't have server totals yet. */
  ratingBreakdown?: Record<"5" | "4" | "3" | "2" | "1", number>;
}) {
  const { t } = useTranslation();
  const SORT_OPTIONS: { label: string; value: SortValue }[] = [
    { label: t("reviews.sort.all"), value: "all" },
    { label: t("reviews.sort.highestRated"), value: "rating-desc" },
    { label: t("reviews.sort.lowestRated"), value: "rating-asc" },
    { label: t("reviews.sort.newest"), value: "newest" },
  ];
  const [sortValue, setSortValue] = useState<SortValue>(SORT_OPTIONS[0].value);
  const [ratings, setRatings] = useState<ServiceRatingApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  /** max-lg starts as a swipeable rail; "View All Reviews" switches it to the full stacked list. */
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRatingsApi({
      slug: serviceSlug,
      provider_slug: providerSlug,
      limit: PAGE_SIZE,
      offset: 0,
      sort: sortValue,
    }).then((response: ServiceRatingsResponse | null) => {
      if (cancelled) return;
      setRatings(response?.data ?? []);
      setTotal(Number(response?.total ?? 0));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [serviceSlug, providerSlug, sortValue]);

  const hasMore = ratings.length < total;

  const loadMore = () => {
    setLoadingMore(true);
    getRatingsApi({
      slug: serviceSlug,
      provider_slug: providerSlug,
      limit: PAGE_SIZE,
      offset: ratings.length,
      sort: sortValue,
    }).then((response: ServiceRatingsResponse | null) => {
      setRatings((current) => [...current, ...(response?.data ?? [])]);
      setLoadingMore(false);
    });
  };

  const breakdown = useMemo(() => {
    if (ratingBreakdown) {
      const grandTotal = Object.values(ratingBreakdown).reduce((sum, count) => sum + count, 0);
      return ([5, 4, 3, 2, 1] as const).map((stars) => {
        const key = String(stars) as "5" | "4" | "3" | "2" | "1";
        return {
          stars,
          percent: grandTotal > 0 ? Math.round((ratingBreakdown[key] / grandTotal) * 100) : 0,
        };
      });
    }
    const counts = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratings.filter((rating) => Math.round(Number(rating.rating)) === stars).length,
    }));
    return counts.map(({ stars, count }) => ({
      stars,
      percent: ratings.length > 0 ? Math.round((count / ratings.length) * 100) : 0,
    }));
  }, [ratings, ratingBreakdown]);

  const openPhoto = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const isEmpty = !loading && ratings.length === 0;
  const filledStars = Math.round(average);

  return (
    <>
      <section className="flex flex-col items-start gap-4 py-6 xl:hidden">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("reviews.ratingAndReviews")}
        </h2>

        {isEmpty ? (
          <EmptyState
            icon={StarIcon}
            title={t("reviews.emptyTitle")}
            description={t("reviews.emptyDescription")}
          />
        ) : (
          <div className="flex flex-col items-start gap-4 self-stretch">
            {/* list layout puts the score summary on its own card; the rail keeps it inline */}
            <div
              className={
                mobileLayout === "list"
                  ? "flex flex-col gap-3 self-stretch rounded-xl bg-bg-primary p-4"
                  : "flex flex-col gap-4 self-stretch"
              }
            >
              <div className="flex flex-col gap-1 self-stretch">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-text-primary">
                    {t("reviews.customerReviews")}
                  </span>
                  <span className="text-2xl font-semibold text-text-primary">
                    {formatRating(average)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-text-secondary">
                    {t("reviews.basedOn", { count: totalRatings })}
                  </span>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, index) => (
                      <StarIcon
                        key={index}
                        className={
                          index < filledStars
                            ? "size-4 text-icon-warning"
                            : "size-4 text-icon-disabled"
                        }
                      />
                    ))}
                  </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 self-stretch">
              {breakdown.map(({ stars, percent }) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-text-primary">{stars}</span>
                    <StarIcon className="size-3.5 text-icon-warning" />
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-bg-secondary">
                    <div
                      className="h-2 rounded-full bg-bg-warning"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs text-text-secondary">
                    {percent}%
                  </span>
                </div>
              ))}
            </div>
            </div>

            {mobileLayout === "rail" && (
              <span className="text-sm font-semibold text-text-primary">
                {t("reviews.customerReviews")}
              </span>
            )}

            {mobileLayout === "list" ? (
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-base font-semibold text-text-primary">
                  {t("reviews.allReviews")}
                </span>
                <Dropdown
                  className="w-32"
                  menuClassName="left-auto right-0"
                  options={SORT_OPTIONS}
                  value={sortValue}
                  onChange={(value) => {
                    setLoading(true);
                    setSortValue(value as SortValue);
                  }}
                />
              </div>
            ) : null}

            {mobileLayout === "list" || mobileExpanded ? (
              <div className="flex flex-col gap-3 self-stretch">
                {ratings.map((rating) => (
                  <MobileReviewCard
                    key={rating.id}
                    rating={rating}
                    onOpenPhoto={openPhoto}
                  />
                ))}
              </div>
            ) : (
              <div className="flex snap-x snap-mandatory gap-3 self-stretch overflow-x-auto pb-1">
                {ratings.map((rating) => (
                  <MobileReviewCard
                    key={rating.id}
                    rating={rating}
                    onOpenPhoto={openPhoto}
                    className="w-[85%] shrink-0 snap-start"
                  />
                ))}
              </div>
            )}

            {(mobileLayout === "list" ? hasMore : !mobileExpanded || hasMore) && (
              <AppButton
                variant="link"
                rightIcon={ArrowRightIcon}
                disabled={loadingMore}
                onClick={() => {
                  if (mobileLayout === "rail" && !mobileExpanded) {
                    setMobileExpanded(true);
                    return;
                  }
                  loadMore();
                }}
                className="h-auto self-center p-0 text-sm font-medium text-text-brand hover:text-text-brand disabled:opacity-60"
              >
                {mobileLayout === "list" || mobileExpanded
                  ? loadingMore
                    ? t("reviews.loading")
                    : t("reviews.loadMore")
                  : t("reviews.viewAll")}
              </AppButton>
            )}
          </div>
        )}
      </section>

      <div className="hidden flex-col items-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-primary p-6 xl:flex">
        <div className="flex items-center gap-6 self-stretch">
          <h2 className="flex-1 text-lg font-medium text-text-primary">
            {t("reviews.title")}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-lg text-text-primary">{t("reviews.sortBy")}</span>
            <Dropdown
              className="w-52"
              options={SORT_OPTIONS}
              value={sortValue}
              onChange={(value) => {
                setLoading(true);
                setSortValue(value as SortValue);
              }}
            />
          </div>
        </div>
        <div className="dashed-divider" />

        {!loading && ratings.length === 0 ? (
          <EmptyState
            icon={StarIcon}
            title={t("reviews.emptyTitle")}
            description={t("reviews.emptyDescription")}
          />
        ) : (
          <div className="flex flex-col items-start gap-4 self-stretch">
            <div className="flex items-start gap-6 self-stretch rounded-lg border border-bg-brand/30 bg-bg-brand-subtle p-6">
              <div className="flex h-36 w-56 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
                <span className="text-4xl font-medium text-text-primary">
                  {formatRating(average)}
                </span>
                <span className="flex items-start gap-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon key={index} className="size-4 text-icon-warning" />
                  ))}
                </span>
                <span className="text-base text-text-primary">
                  {t(reviewCountKey(totalRatings), { count: totalRatings })}
                </span>
              </div>

              <div className="flex flex-1 flex-col items-start justify-center gap-2">
                {breakdown.map(({ stars, percent }) => (
                  <div
                    key={stars}
                    className="flex items-center gap-3 self-stretch"
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-base text-text-primary">
                        {stars}
                      </span>
                      <StarIcon className="size-3.5 text-icon-primary" />
                    </span>
                    <div className="h-2.5 flex-1 rounded-xl bg-bg-primary">
                      <div
                        className="h-2.5 rounded-xl bg-bg-brand"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-base font-medium text-text-primary">
                      {percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 self-stretch">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="flex flex-col items-center gap-4 self-stretch rounded-xl border border-border-default bg-bg-primary p-4"
                >
                  <div className="flex items-center gap-3 self-stretch">
                    <AppImage
                      src={rating.profile_image}
                      alt={rating.user_name}
                      className="size-12 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col items-start gap-1">
                      <span className="text-base font-medium text-text-primary">
                        {rating.user_name}
                      </span>
                      <span className="text-base text-text-secondary">
                        {formatDateTime(rating.rated_on)}
                      </span>
                    </div>
                    <AppTag
                      variant="warning"
                      shape="pill"
                      leftIcon={StarIcon}
                      iconClassName="size-4 text-icon-warning"
                      className="border border-bg-warning/20"
                    >
                      <span className="text-base font-medium text-text-primary">
                        {formatRating(rating.rating)}
                      </span>
                    </AppTag>
                  </div>
                  <div className="dashed-divider" />

                  <div className="flex flex-col items-start gap-4 self-stretch">
                    <p className="flex-1 text-sm text-text-primary">
                      {rating.comment}
                    </p>
                    {rating.images.length > 0 && (
                      <div className="flex items-start gap-3 self-stretch">
                        {rating.images.map((photo, index) => (
                          <AppButton
                            key={photo}
                            variant="link"
                            onClick={() => {
                              setLightboxImages(rating.images);
                              setLightboxIndex(index);
                            }}
                            className="size-14 shrink-0 p-0"
                          >
                            <AppImage
                              src={photo}
                              alt={`${rating.user_name} review photo ${index + 1}`}
                              className="size-14 rounded-lg object-cover"
                            />
                          </AppButton>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <AppButton
                variant="link"
                onClick={loadMore}
                disabled={loadingMore}
                className="h-auto self-center p-0 text-base font-medium text-text-brand underline hover:text-text-brand disabled:opacity-60"
              >
                {loadingMore ? t("reviews.loading") : t("reviews.loadMore")}
              </AppButton>
            )}
          </div>
        )}

      </div>

      <GalleryLightbox
        images={lightboxImages ?? []}
        title={t("reviews.title")}
        open={lightboxImages !== null}
        activeIndex={lightboxIndex}
        onOpenChange={(open) => {
          if (!open) setLightboxImages(null);
        }}
        onActiveIndexChange={setLightboxIndex}
      />
    </>
  );
}

/** Review tile used by the max-lg rail and its expanded list. */
function MobileReviewCard({
  rating,
  onOpenPhoto,
  className = "",
}: {
  rating: ServiceRatingApi;
  onOpenPhoto: (images: string[], index: number) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-border-default bg-bg-primary p-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <AppImage
          src={rating.profile_image}
          alt={rating.user_name}
          className="size-10 shrink-0 rounded-lg object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-text-primary">
            {rating.user_name}
          </span>
          <span className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <StarIcon className="size-3.5 shrink-0 text-icon-warning" />
              <span className="font-medium text-text-primary">
                {formatRating(rating.rating)}
              </span>
            </span>
            <span className="size-1 rounded-full bg-bg-tertiary" />
            {formatRelativeTime(rating.rated_on)}
          </span>
        </div>
        {rating.service_name && (
          <AppTag
            variant="brand"
            shape="chip"
            className="max-w-32 shrink-0 text-xs text-text-brand"
          >
            <span className="truncate">{rating.service_name}</span>
          </AppTag>
        )}
      </div>

      <p className="line-clamp-2 text-sm text-text-secondary">{rating.comment}</p>

      {rating.images.length > 0 && (
        <div className="flex items-center gap-2">
          {rating.images.slice(0, MOBILE_PHOTO_LIMIT).map((photo, index) => {
            const hiddenCount = rating.images.length - MOBILE_PHOTO_LIMIT;
            const isOverflowTile = hiddenCount > 0 && index === MOBILE_PHOTO_LIMIT - 1;
            return (
              <AppButton
                key={photo}
                variant="link"
                onClick={() => onOpenPhoto(rating.images, index)}
                className="relative size-12 shrink-0 overflow-hidden rounded-md p-0"
              >
                <AppImage
                  src={photo}
                  alt={`${rating.user_name} review photo ${index + 1}`}
                  className="size-12 rounded-md object-cover"
                />
                {isOverflowTile && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 text-xs font-medium text-white">
                    {t("reviews.morePhotos", { count: hiddenCount + 1 })}
                  </span>
                )}
              </AppButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
