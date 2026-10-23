"use client";

import { Fragment } from "react";
import { useRouter } from "next/router";
import { Link } from "@/components/ui/locale-link";

import { ArrowLeftIcon, HomeIcon, ShareIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { cn } from "@/lib/utils";

export interface PageBreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  title: string;
  items: PageBreadcrumbItem[];
  /** Drops the title text from the mobile bar, leaving just the back arrow —
   * for landing pages with their own hero heading right below (e.g.
   * become-provider), where a redundant title bar adds nothing. */
  hideMobileTitle?: boolean;
  /** Hides the desktop breadcrumb bar entirely — for pages that only need
   * the mobile back arrow and render their own desktop navigation/heading. */
  hideDesktopBar?: boolean;
  /** Shows a share icon button in the mobile header bar — pages that need
   * their own mobile header action (e.g. service-details' Share) render it
   * here instead of stacking a second header component underneath. */
  share?: boolean;
  onShare?: () => void;
  /** Pages whose next section already provides its own visual separation
   * (e.g. bookings' tabs bar) can drop the mobile header's bottom divider. */
  hideMobileDivider?: boolean;
  /** Pages reached directly from the bottom nav (e.g. Bookings) have nowhere
   * meaningful to go "back" to — hide the arrow instead of a dead-end back. */
  hideBack?: boolean;
  /** Fully hides the mobile header bar (not just its back arrow) — for pages
   * that swap in their own bespoke mobile header for a sub-view (e.g. a chat
   * thread's own back-to-list + avatar header) while still needing this
   * component's desktop breadcrumb bar to render as normal. */
  hideMobileBar?: boolean;
  /** Overrides the back arrow to always navigate here instead of browser history —
   * for pages whose real parent isn't necessarily the previous history entry (e.g.
   * booking details reached via the payment-status redirect page: history-back would
   * land back on that transient page instead of the bookings list it actually belongs
   * under, per this same breadcrumb's own parent item). */
  backHref?: string;
}

function BreadcrumbDot() {
  return (
    <BreadcrumbSeparator>
      <span className="inline-block size-2 opacity-75 bg-bg-inverse rounded-full" />
    </BreadcrumbSeparator>
  );
}

export function PageBreadcrumb({
  title,
  items,
  share,
  onShare,
  hideMobileDivider,
  hideBack,
  hideMobileBar,
  hideMobileTitle,
  hideDesktopBar,
  backHref,
}: PageBreadcrumbProps) {
  const lastIndex = items.length - 1;
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(localizePath(backHref, lang, defaultLocale));
      return;
    }
    // history.length is 1 on a fresh tab/direct link — router.back() would
    // be a no-op (or leave the site) there, so go home instead.
    if (typeof window !== "undefined" && window.history.length <= 1) {
      router.push(localizePath("/", lang, defaultLocale));
      return;
    }
    router.back();
  };

  return (
    <>
      <div
        className={cn(
          "flex h-14 items-center gap-3 bg-bg-primary px-4 xl:hidden",
          !hideMobileDivider && "border-b border-border-default",
          hideMobileBar && "hidden"
        )}
      >
        {!hideBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("account.profile.back")}
            className="flex size-8 shrink-0 items-center justify-center"
          >
            <ArrowLeftIcon className="size-6 text-text-primary rtl:rotate-180" />
          </button>
        )}
        {!hideMobileTitle && <h1 className="flex-1 text-lg font-semibold text-text-primary">{title}</h1>}
        {share && onShare && (
          <AppButton
            variant="link"
            size="lg"
            iconOnly
            leftIcon={ShareIcon}
            aria-label={t("common.share")}
            onClick={onShare}
          >
            {t("common.share")}
          </AppButton>
        )}
      </div>

      <div className={cn("w-full bg-bg-secondary border-b border-border-default max-xl:hidden", hideDesktopBar && "hidden")}>
      <div className="container flex items-center gap-6 py-4">
        <div className="flex-1">
          <h1 className="text-text-primary text-xl font-medium leading-7">
            {title}
          </h1>
        </div>

        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap gap-3 rounded-3xl">
            <BreadcrumbItem className="gap-1">
              <BreadcrumbLink asChild>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-1 text-text-primary text-lg font-normal leading-7"
                >
                  <HomeIcon className="size-6 text-icon-primary" />
                  <span>
                    {t("nav.home")}
                  </span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {items.map((item, index) => (
              <Fragment key={item.label}>
                <BreadcrumbDot />
                <BreadcrumbItem>
                  {index === lastIndex || !item.href ? (
                    <BreadcrumbPage className="px-4 py-2 bg-bg-primary rounded-3xl border border-border-default text-text-brand text-lg font-normal leading-7">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className="text-text-primary text-lg font-normal leading-7"
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      </div>
    </>
  );
}
