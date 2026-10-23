"use client";

import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { AppButton } from "@/components/ui/app-button";
import { ServiceCardSkeleton } from "@/components/services/service-card-skeleton";
import { getNotificationsApi, type NotificationApi, type NotificationsResponse } from "@/api/apiRoutes";
import { readLocationCookieFromDocument } from "@/lib/location-cookie";
import { NotificationCard, NotificationCardMobile } from "@/components/account/notification-card";
import { NoNotificationIllustration } from "@/components/common/no-notification-illustration";
import { formatFullDate, getRelativeDayKey } from "@/lib/helpers";
import { useTranslation } from "@/lib/i18n/translation-context";
import ProfileLayout from "@/components/account/ProfileLayout";

const PAGE_SIZE = 10;
// Remembers how many the user had loaded (via "Load More") across a plain
// browser refresh — per-tab, cleared on tab close, since it's just resuming
// a scroll position rather than data worth keeping long-term.
const VISIBLE_COUNT_STORAGE_KEY = "notifications-visible-count";

function getStoredVisibleCount(): number {
  if (typeof window === "undefined") return PAGE_SIZE;
  const stored = Number(window.sessionStorage.getItem(VISIBLE_COUNT_STORAGE_KEY));
  return Number.isFinite(stored) && stored > PAGE_SIZE ? stored : PAGE_SIZE;
}

export function NotificationsView() {
  const { t } = useTranslation();
  const title = t("account.notifications.title");

  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  const [total, setTotal] = useState(0);
  const [visibleCount, setVisibleCount] = useState(getStoredVisibleCount);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const location = readLocationCookieFromDocument();

    getNotificationsApi({
      platform: "web",
      latitude: location?.lat,
      longitude: location?.lng,
      limit: visibleCount,
      offset: 0,
    }).then((response: NotificationsResponse | null) => {
      if (cancelled) return;
      if (response?.error) {
        setStatus("error");
        return;
      }
      setNotifications(response?.data ?? []);
      setTotal(Number(response?.total ?? 0));
      setStatus("loaded");
      window.sessionStorage.setItem(VISIBLE_COUNT_STORAGE_KEY, String(visibleCount));
    });

    return () => {
      cancelled = true;
    };
  }, [visibleCount]);

  const hasMore = notifications.length < total;

  // "Today" / "Yesterday" / "12 November 2026" buckets, in the order the API
  // returned them (newest first) rather than re-sorting.
  const groups: { key: string; label: string; items: NotificationApi[] }[] = [];
  for (const notification of notifications) {
    const dayKey = getRelativeDayKey(notification.date_sent);
    const key = dayKey ?? notification.date_sent.split(" ")[0];
    const label = dayKey ? t(`account.notifications.${dayKey}`) : formatFullDate(notification.date_sent);
    const group = groups.at(-1);
    if (group?.key === key) group.items.push(notification);
    else groups.push({ key, label, items: [notification] });
  }

  const loadMoreButton = hasMore && (
    <AppButton
      variant="secondary-outline"
      size="md"
      className="mx-auto"
      disabled={status === "loading"}
      onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}
    >
      {t("account.notifications.loadMore")}
    </AppButton>
  );

  const emptyState = (
    <div className="flex w-full flex-col items-center gap-3 py-16 text-center">
      <NoNotificationIllustration className="h-auto w-56 text-icon-brand" />
      <span className="text-2xl font-medium text-text-primary">
        {t("account.notifications.empty")}
      </span>
      <span className="max-w-md text-base text-text-secondary">
        {t("account.notifications.emptyDescription")}
      </span>
    </div>
  );

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />

      {/* Mobile */}
      <div className="xl:hidden">
        <ProfileLayout title={t("account.notifications.mobileTitle")}>
          {status === "loading" && notifications.length === 0 ? (
            <div className="flex w-full flex-col gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            emptyState
          ) : (
            <div className="flex w-full flex-col gap-5">
              {groups.map((group) => (
                <div key={group.key} className="flex w-full flex-col gap-3">
                  <p className="text-sm font-semibold text-text-primary">{group.label}</p>
                  {group.items.map((notification) => (
                    <NotificationCardMobile key={notification.id} notification={notification} />
                  ))}
                </div>
              ))}
              {loadMoreButton}
            </div>
          )}
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
            {status === "loading" && notifications.length === 0 ? (
              <div className="flex w-full flex-col gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              emptyState
            ) : (
              <>
                {groups.map((group) => (
                  <div key={group.key} className="flex w-full flex-col items-start gap-4">
                    <p className="text-sm font-semibold text-text-primary">{group.label}</p>
                    {group.items.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </div>
                ))}
                {loadMoreButton}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
