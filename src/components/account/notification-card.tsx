"use client";

import { useRouter } from "next/router";
import { AppImage } from "@/components/ui/app-image";
import {
  AccountNotificationsIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "@/components/icons/icons";
import type { NotificationApi } from "@/api/apiRoutes";
import { getNotificationCtaLabelKey, getNotificationRedirectUrl } from "@/lib/notification-redirect";
import { localizePath } from "@/lib/i18n/locale-path";
import { formatTimeAgo } from "@/lib/helpers";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Shared click/keyboard behaviour for both the desktop and mobile cards. */
function useNotificationRedirect(notification: NotificationApi) {
  const { lang, defaultLocale } = useTranslation();
  const router = useRouter();

  // Backend sends extra routing fields (type, booking_id, provider_slug, ...)
  // beyond what NotificationApi types for rendering — read them loosely.
  const data = notification as unknown as Record<string, unknown>;
  const redirectUrl = getNotificationRedirectUrl(data);

  const handleRedirect = () => {
    if (!redirectUrl) return;

    if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(localizePath(redirectUrl, lang, defaultLocale));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRedirect();
    }
  };

  return { redirectUrl, redirectable: redirectUrl !== null, handleRedirect, handleKeyDown };
}

/** Mobile list row: bell tile, title + time, message, "View Booking ›" link. */
export function NotificationCardMobile({ notification }: { notification: NotificationApi }) {
  const { t } = useTranslation();
  const { redirectUrl, redirectable, handleRedirect, handleKeyDown } =
    useNotificationRedirect(notification);

  return (
    <div
      role={redirectable ? "button" : "none"}
      tabIndex={redirectable ? 0 : -1}
      onClick={redirectable ? handleRedirect : undefined}
      onKeyDown={redirectable ? handleKeyDown : undefined}
      className={`flex w-full items-start gap-3 rounded-2xl bg-bg-primary p-4 ${
        redirectable ? "cursor-pointer" : ""
      }`}
    >
      {notification.image ? (
        <AppImage
          src={notification.image}
          alt={notification.title}
          className="size-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
          <AccountNotificationsIcon className="size-5 text-icon-primary" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <div className="flex w-full items-start gap-2">
          <span className="flex-1 text-sm font-semibold text-text-primary">{notification.title}</span>
          <span className="shrink-0 text-xs text-text-secondary">
            {formatTimeAgo(notification.date_sent, t)}
          </span>
        </div>
        <span className="text-xs text-text-secondary">{notification.message}</span>
        {redirectUrl !== null && (
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-button-link-primary-focus">
            {t(`account.notifications.cta.${getNotificationCtaLabelKey(redirectUrl)}`)}
            <ChevronRightIcon className="size-4 rtl:rotate-180" />
          </span>
        )}
      </div>
    </div>
  );
}

export function NotificationCard({ notification }: { notification: NotificationApi }) {
  const { t } = useTranslation();
  const { redirectUrl, redirectable, handleRedirect, handleKeyDown } =
    useNotificationRedirect(notification);

  return (
    <div
      role={redirectable ? "button" : "none"}
      tabIndex={redirectable ? 0 : -1}
      onClick={redirectable ? handleRedirect : undefined}
      onKeyDown={redirectable ? handleKeyDown : undefined}
      className={`flex w-full items-start gap-4 rounded-lg border border-border-default bg-bg-primary p-4 ${
        redirectable ? "cursor-pointer transition-colors duration-200 hover:bg-bg-secondary" : ""
      }`}
    >
      {notification.image ? (
        <AppImage
          src={notification.image}
          alt={notification.title}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle p-3">
          <AccountNotificationsIcon className="size-6 text-icon-brand" />
        </span>
      )}
      <div className="flex flex-1 flex-col items-start gap-3">
        <div className="flex flex-col items-start gap-1">
          <span className="text-base font-medium text-text-primary">{notification.title}</span>
          <span className="text-sm text-text-secondary">{notification.message}</span>
        </div>
        {redirectUrl !== null && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-sm text-button-link-primary-focus">
            {t(`account.notifications.cta.${getNotificationCtaLabelKey(redirectUrl)}`)}
            <ArrowRightIcon className="size-5 rtl:rotate-180" />
          </span>
        )}
      </div>
      <span className="shrink-0 text-sm text-text-secondary">
        {formatTimeAgo(notification.date_sent, t)}
      </span>
    </div>
  );
}
