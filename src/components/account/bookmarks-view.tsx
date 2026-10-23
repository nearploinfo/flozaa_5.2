"use client";

import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { BookmarksEmptyState } from "@/components/account/bookmarks-empty-state";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { BookmarkServiceCard } from "@/components/account/bookmark-service-card";
import { ServiceCard } from "@/components/home/service-card";
import { ProviderCard } from "@/components/home/provider-card";
import { ServiceCardSkeleton } from "@/components/services/service-card-skeleton";
import { listBookmarksApi } from "@/api/apiRoutes";
import { toServiceCardData, type ServiceListItemApi, type ServiceCardData } from "@/lib/services-catalog";
import {
  toNearbyProviderCard,
  type ProviderListItemApi,
  type NearbyProvider,
} from "@/lib/providers-catalog";
import { readLocationCookieFromDocument } from "@/lib/location-cookie";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";
import ProfileLayout from "./ProfileLayout";

type BookmarkTab = "services" | "providers";

export function BookmarksView() {
  const { t } = useTranslation();
  const title = t("account.bookmarks.title");

  const [tab, setTab] = useState<BookmarkTab>("services");
  const [services, setServices] = useState<ServiceCardData[] | null>(null);
  const [providers, setProviders] = useState<NearbyProvider[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const location = readLocationCookieFromDocument();

    Promise.all([
      listBookmarksApi({ bookmark_type: "service", latitude: location?.lat, longitude: location?.lng }),
      listBookmarksApi({ bookmark_type: "provider", latitude: location?.lat, longitude: location?.lng }),
    ]).then(([serviceResponse, providerResponse]) => {
      if (cancelled) return;
      const serviceItems: ServiceListItemApi[] = serviceResponse?.data ?? [];
      const providerItems: ProviderListItemApi[] = providerResponse?.data ?? [];
      setServices(serviceItems.map(toServiceCardData));
      setProviders(providerItems.map(toNearbyProviderCard));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const serviceCount = services?.length ?? 0;
  const providerCount = providers?.length ?? 0;

  const handleServiceUnbookmark = (serviceId: string) => (bookmarked: boolean) => {
    if (bookmarked) return;
    setServices((current) => current?.filter((item) => item.id !== serviceId) ?? current);
  };

  const handleProviderUnbookmark = (providerId: string) => (bookmarked: boolean) => {
    if (bookmarked) return;
    setProviders((current) => current?.filter((item) => item.id !== providerId) ?? current);
  };

  const tabsMobile = (
    <div className="flex sticky top-14 z-30 w-full items-stretch border-b border-border-default bg-bg-primary">
      <button
        type="button"
        onClick={() => setTab("services")}
        className={cn(
          "flex-1 border-b-2 pb-3 text-base font-medium",
          tab === "services"
            ? "border-bg-brand text-text-brand"
            : "border-transparent text-text-primary"
        )}
      >
        {t("account.bookmarks.servicesTab", { count: String(serviceCount).padStart(2, "0") })}
      </button>
      <button
        type="button"
        onClick={() => setTab("providers")}
        className={cn(
          "flex-1 border-b-2 pb-3 text-base font-medium",
          tab === "providers"
            ? "border-bg-brand text-text-brand"
            : "border-transparent text-text-primary"
        )}
      >
        {t("account.bookmarks.providersTab", { count: String(providerCount).padStart(2, "0") })}
      </button>
    </div>
  );

  const tabsDesktop = (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => setTab("services")}
        className={cn(
          "rounded-full px-4 py-3 text-base",
          tab === "services"
            ? "bg-bg-inverse text-text-inverse-dark"
            : "border border-border-default bg-bg-primary text-text-primary"
        )}
      >
        {t("account.bookmarks.servicesTab", { count: String(serviceCount).padStart(2, "0") })}
      </button>
      <button
        type="button"
        onClick={() => setTab("providers")}
        className={cn(
          "rounded-full px-4 py-3 text-base",
          tab === "providers"
            ? "bg-bg-inverse text-text-inverse-dark"
            : "border border-border-default bg-bg-primary text-text-primary"
        )}
      >
        {t("account.bookmarks.providersTab", { count: String(providerCount).padStart(2, "0") })}
      </button>
    </div>
  );

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />

      {/* Mobile */}
      <div className="xl:hidden">
        <ProfileLayout title={title}>
          <div className="flex w-full flex-col items-start gap-4 pb-4">
            {tabsMobile}

            {loading ? (
              <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </div>
            ) : tab === "services" ? (
              serviceCount === 0 ? (
                <BookmarksEmptyState
                  title={t("account.bookmarks.emptyTitle")}
                  description={t("account.bookmarks.emptyServicesDescription")}
                />
              ) : (
                <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                  {services?.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      initialBookmarked
                      onBookmarkChange={handleServiceUnbookmark(service.id)}
                    />
                  ))}
                </div>
              )
            ) : providerCount === 0 ? (
              <BookmarksEmptyState
                title={t("account.bookmarks.emptyTitle")}
                description={t("account.bookmarks.emptyProvidersDescription")}
              />
            ) : (
              <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                {providers?.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    style="style-1"
                    initialBookmarked
                    onBookmarkChange={handleProviderUnbookmark(provider.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ProfileLayout>
      </div>

      {/* Desktop */}
      <div className="container hidden flex-col items-start gap-6 py-16 xl:flex xl:flex-row xl:justify-center">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
            <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
          </div>
          <div className="flex w-full flex-col items-start gap-6 p-6">
            {tabsDesktop}

            {loading ? (
              <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </div>
            ) : tab === "services" ? (
              serviceCount === 0 ? (
                <BookmarksEmptyState
                  title={t("account.bookmarks.emptyTitle")}
                  description={t("account.bookmarks.emptyServicesDescription")}
                />
              ) : (
                <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
                  {services?.map((service) => (
                    <BookmarkServiceCard
                      key={service.id}
                      service={service}
                      onBookmarkChange={handleServiceUnbookmark(service.id)}
                    />
                  ))}
                </div>
              )
            ) : providerCount === 0 ? (
              <BookmarksEmptyState
                title={t("account.bookmarks.emptyTitle")}
                description={t("account.bookmarks.emptyProvidersDescription")}
              />
            ) : (
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {providers?.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    style="style-1"
                    initialBookmarked
                    onBookmarkChange={handleProviderUnbookmark(provider.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
