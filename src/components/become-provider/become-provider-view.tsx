"use client";

import { useEffect, useState } from "react";
import { getBecomeProviderSetingsApi } from "@/api/apiRoutes";
import { siteConfig } from "@/lib/site-config";
import type { BecomeProviderData, BecomeProviderResponse } from "@/lib/become-provider";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { LocationModal } from "@/components/layout/location-modal";
import { ProviderRegisterModal } from "@/components/auth/provider/provider-register-modal";
import { HeroSection } from "@/components/become-provider/hero-section";
import { HowItWorksSection } from "@/components/become-provider/how-it-works-section";
import { FeatureSplitSection } from "@/components/become-provider/feature-split-section";
import { ServicesGridSection } from "@/components/become-provider/services-grid-section";
import { SubscriptionSection } from "@/components/become-provider/subscription-section";
import { TopProvidersSection } from "@/components/become-provider/top-providers-section";
import { ReviewsSection } from "@/components/become-provider/reviews-section";
import { GetAppSection } from "@/components/become-provider/get-app-section";
import { FaqsSection } from "@/components/become-provider/faqs-section";
import { Loader } from "@/components/layout/loader";

export function BecomeProviderView({ initialData }: { initialData?: BecomeProviderData }) {
  const { t } = useTranslation();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [data, setData] = useState<BecomeProviderData | undefined>(initialData);
  const [loading, setLoading] = useState(!siteConfig.seoEnabled);
  const hasHydrated = useHasHydrated();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const needsLocation = hasHydrated && savedLat == null && savedLng == null;

  useEffect(() => {
    // Skip the initial client fetch when SSR already provided data for the
    // no-location default — once the real location resolves below, that
    // effect refetches with it.
    if (siteConfig.seoEnabled && initialData && savedLat == null && savedLng == null) return;
    if (!hasHydrated || savedLat == null || savedLng == null) return;

    (
      getBecomeProviderSetingsApi({ latitude: savedLat, longitude: savedLng }) as Promise<BecomeProviderResponse | null>
    ).then((response) => {
      if (response?.error === false) setData(response.data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, savedLat, savedLng]);

  const locationGate = <LocationModal open={needsLocation} onOpenChange={() => {}} required />;

  if (loading || !data) {
    return (
      <>
        {locationGate}
        <PageBreadcrumb
          title={t("footer.becomeAnProvider")}
          items={[{ label: t("footer.becomeAnProvider") }]}
          hideMobileTitle
          hideDesktopBar
        />
        <Loader />
      </>
    );
  }

  const hero = data.hero_section;
  const howItWork = data.how_it_work_section;
  const feature = data.feature_section;
  const category = data.category_section;
  const subscription = data.subscription_section;
  const topProviders = data.top_providers_section;
  const review = data.review_section;
  const faq = data.faq_section;

  const hasReviews = review?.status === 1 && (review?.reviews?.length ?? 0) > 0;

  return (
    <div className="pb-10">
      {locationGate}
      <PageBreadcrumb
        title={t("footer.becomeAnProvider")}
        items={[{ label: t("footer.becomeAnProvider") }]}
        hideMobileTitle
        hideDesktopBar
      />

      {hero?.status === 1 && (
        <HeroSection
          data={hero}
          categories={category?.categories}
          totalRating={Number(data.rating) || undefined}
          happyCustomers={data.happyCustomers}
          onGetStarted={() => setRegisterOpen(true)}
        />
      )}

      {howItWork?.status === 1 && (howItWork.steps?.length ?? 0) > 0 && <HowItWorksSection data={howItWork} />}

      {feature?.status === 1 &&
        feature.features?.map((item, index) => <FeatureSplitSection key={index} feature={item} />)}

      {category?.status === 1 && (category.categories?.length ?? 0) > 0 && <ServicesGridSection data={category} />}

      {subscription?.status === 1 && (subscription.subscriptions?.length ?? 0) > 0 && (
        <SubscriptionSection data={subscription} />
      )}

      {topProviders?.status === 1 && (topProviders.providers?.length ?? 0) > 0 && (
        <TopProvidersSection data={topProviders} />
      )}

      {hasReviews && review && <ReviewsSection data={review} totalRating={Number(data.rating) || undefined} />}

      <GetAppSection />

      {faq?.status === 1 && (faq.faqs?.length ?? 0) > 0 && <FaqsSection data={faq} />}

      <ProviderRegisterModal open={registerOpen} onOpenChange={setRegisterOpen} />
    </div>
  );
}
