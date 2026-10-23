"use client";

import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ProviderHero } from "@/components/providers/provider-hero";
import { ProviderTabsSection } from "@/components/providers/provider-tabs-nav";
import { ProviderServicesSection } from "@/components/providers/provider-services-section";
import { ProviderAboutSection } from "@/components/providers/provider-about-section";
import { ProviderLocationSection } from "@/components/providers/provider-location-section";
import { ProviderBusinessHoursSection } from "@/components/providers/provider-business-hours-section";
import { ProviderGallerySection } from "@/components/providers/provider-gallery-section";
import { ProviderOffersSection } from "@/components/providers/provider-offers-section";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { ProviderCartBar } from "@/components/providers/provider-cart-bar";
import { getAllPromocodesApi, type PromoCodeApi } from "@/api/apiRoutes";
import {
  isProviderOpenNow,
  toBusinessHours,
  type ProviderDetailApi,
} from "@/lib/providers-catalog";
import type { ServiceCardData } from "@/lib/services-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

export function ProviderDetailsView({
  provider,
  services,
  priceBounds,
}: {
  provider: ProviderDetailApi;
  services: ServiceCardData[];
  priceBounds?: { min: number; max: number };
}) {
  const { t } = useTranslation();
  const businessHours = toBusinessHours(provider.shifts_by_day);
  const openNow = isProviderOpenNow(provider.shifts_by_day);

  // Offers load client-side only (no SSR count to check upfront) — fetched
  // here rather than inside ProviderOffersSection so the tab can stay
  // hidden entirely until this confirms there's at least one to show.
  const OFFERS_PAGE_SIZE = 10;
  const [offers, setOffers] = useState<PromoCodeApi[]>([]);
  const [offersStatus, setOffersStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [offersTotal, setOffersTotal] = useState(0);
  const [loadingMoreOffers, setLoadingMoreOffers] = useState(false);

  const loadMoreOffers = () => {
    if (loadingMoreOffers) return;
    setLoadingMoreOffers(true);
    getAllPromocodesApi({ provider_id: provider.partner_id, limit: OFFERS_PAGE_SIZE, offset: offers.length })
      .then((response) => {
        if (!response?.error) setOffers((current) => [...current, ...(response?.data ?? [])]);
      })
      .finally(() => setLoadingMoreOffers(false));
  };

  useEffect(() => {
    let cancelled = false;
    getAllPromocodesApi({ provider_id: provider.partner_id, limit: OFFERS_PAGE_SIZE, offset: 0 })
      .then((response) => {
        if (cancelled) return;
        setOffers(response?.error ? [] : (response?.data ?? []));
        setOffersTotal(response?.error ? 0 : Number(response?.total ?? 0));
        setOffersStatus("loaded");
      })
      .catch(() => {
        if (cancelled) return;
        setOffers([]);
        setOffersTotal(0);
        setOffersStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [provider.partner_id]);

  return (
    <div className="flex flex-col">
      <div className="hidden xl:block">
        <PageBreadcrumb
          title={t("providerDetails.title")}
          items={[
            { label: t("providerDetails.breadcrumb.provider"), href: "/providers" },
            { label: t("providerDetails.breadcrumb.providerDetails") },
          ]}
        />
      </div>
      <ProviderHero provider={provider} />
      <ProviderTabsSection
        panels={{
          ...(services.length > 0 && {
            services: <ProviderServicesSection services={services} priceBounds={priceBounds} />,
          }),
          about: (
            <div className="flex flex-col gap-6 self-stretch lg:flex-row lg:items-start">
              <div className="flex flex-1 flex-col items-start gap-6">
                <ProviderAboutSection
                  about={provider.about}
                  longDescription={provider.long_description}
                />
                <ProviderLocationSection
                  address={provider.address}
                  latitude={provider.latitude}
                  longitude={provider.longitude}
                />
              </div>
              <ProviderBusinessHoursSection businessHours={businessHours} openNow={openNow} />
            </div>
          ),
          ...(provider.other_images.length > 0 && {
            gallery: (
              <ProviderGallerySection images={provider.other_images} title={provider.company_name} />
            ),
          }),
          ...(offers.length > 0 && {
            offers: (
              <ProviderOffersSection
                offers={offers}
                status={offersStatus}
                hasMore={offers.length < offersTotal}
                loadingMore={loadingMoreOffers}
                onLoadMore={loadMoreOffers}
              />
            ),
          }),
          ...(Number(provider.number_of_ratings) > 0 && {
            reviews: (
              <ReviewsSection
                providerSlug={provider.slug}
                average={Number(provider.average_rating)}
                totalRatings={Number(provider.number_of_ratings)}
                ratingBreakdown={provider.rating_breakdown}
                mobileLayout="list"
              />
            ),
          }),
        }}
      />

      <ProviderCartBar
        providerId={provider.partner_id}
        providerImage={provider.profile_image}
      />
    </div>
  );
}
